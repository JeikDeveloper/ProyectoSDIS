"""
ETL para el archivo OFERTA DISPONIBLE - SERVICIO CDC
(Centros de Desarrollo Comunitario — Secretaría de Integración Social).

El archivo trae una sola hoja con el encabezado desplazado (filas en blanco al
inicio) y columnas con nombres propios. La localidad y una fecha por defecto las
aporta el funcionario; las fechas reales se toman del archivo cuando existen
(las filas que dicen "POR CONFIRMAR" usan la fecha por defecto).

Todos los registros se cargan como tipo "Actividad" y organizador "Secretaría".
La información extra (eje, modalidad, horario, cupos, etc.) se resume en la
descripción para no requerir cambios de esquema.
"""

import io
import math
import re
import unicodedata
from datetime import date
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models.actividad import Actividad
from app.models.localidad import Localidad

TIPO_CDC = "Actividad"
ORGANIZADOR_CDC = "Secretaría"


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def _norm(texto) -> str:
    """Normaliza un encabezado: sin acentos, mayúsculas, espacios colapsados."""
    if texto is None:
        return ""
    s = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", s).strip().upper()


def _limpia(val) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, float):
        try:
            if math.isnan(val):
                return None
        except Exception:
            pass
    text = re.sub(r"\s+", " ", str(val).replace("\n", " ").replace("\r", " ")).strip()
    return text if text else None


def _es_por_confirmar(val) -> bool:
    t = _norm(val)
    return t in ("", "NAN") or "POR CONFIRMAR" in t


def _parse_fecha(val) -> Optional[date]:
    """date si la celda trae una fecha real; None si vacía / POR CONFIRMAR / inválida."""
    if _es_por_confirmar(val):
        return None
    try:
        ts = pd.to_datetime(val, dayfirst=True, errors="raise")
        return None if pd.isna(ts) else ts.date()
    except Exception:
        return None


def _clave_columna(h: str) -> Optional[str]:
    """Mapea un encabezado normalizado a una clave canónica."""
    if "NOMBRE DE LA ACTIVIDAD" in h:
        return "titulo"
    if "INTENSIDAD HORARIA" in h:
        return "intensidad"
    if h == "HORARIO":
        return "horario"
    if "FECHA INICIO" in h:
        return "fecha_inicio"
    if "FECHA FIN" in h:
        return "fecha_fin"
    if h == "LUGAR":
        return "lugar"
    if "DIRECCION" in h:
        return "direccion"
    if "EJE" in h:
        return "eje"
    if "CANAL" in h:
        return "canal"
    if h == "DIAS":
        return "dias"
    if "CUPOS" in h:
        return "cupos"
    if "NOMBRE ENTIDAD" in h:
        return "entidad"
    if "CERTIFICADO" in h:
        return "certificado"
    if "CONTACTO" in h or "INSCRIPCION" in h or "CORREO" in h:
        return "contacto"
    return None


# Claves que se resumen en la descripción (clave → etiqueta visible)
_DESC_CAMPOS = [
    ("eje",         "Eje"),
    ("canal",       "Modalidad"),
    ("dias",        "Días"),
    ("horario",     "Horario"),
    ("intensidad",  "Intensidad horaria"),
    ("cupos",       "Cupos"),
    ("entidad",     "Entidad"),
    ("certificado", "Certificado"),
    ("contacto",    "Inscripción/Contacto"),
]


def _detectar_encabezado(df: pd.DataFrame) -> Optional[int]:
    """Índice de la fila que contiene 'NOMBRE DE LA ACTIVIDAD'."""
    for i in range(min(15, len(df))):
        for val in df.iloc[i].tolist():
            if "NOMBRE DE LA ACTIVIDAD" in _norm(val):
                return i
    return None


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------

def procesar_cdc(
    contenido: bytes,
    nombre_localidad: str,
    fecha_inicio_default: date,
    fecha_fin_default: Optional[date],
    db: Session,
    dry_run: bool = False,
) -> dict:
    """
    Parsea la oferta CDC y, si dry_run=False, inserta en la BD.

    Retorna: { error, insertados, filas_procesadas, filas_con_error, errores, muestra }
    """
    base = {
        "error": None,
        "insertados": 0,
        "filas_procesadas": 0,
        "filas_con_error": 0,
        "errores": [],
        "muestra": [],
    }

    localidad_obj = db.query(Localidad).filter(Localidad.nombre == nombre_localidad).first()
    if not localidad_obj:
        base["error"] = f"Localidad '{nombre_localidad}' no encontrada en la base de datos."
        return base

    try:
        xls = pd.ExcelFile(io.BytesIO(contenido))
        df = pd.read_excel(xls, sheet_name=0, header=None)
    except Exception as exc:
        base["error"] = f"No se pudo leer el archivo Excel: {exc}"
        return base

    fila_enc = _detectar_encabezado(df)
    if fila_enc is None:
        base["error"] = (
            "El archivo no tiene el formato CDC esperado "
            "(no se encontró la columna 'NOMBRE DE LA ACTIVIDAD')."
        )
        return base

    colmap: dict[str, int] = {}
    for ci, val in enumerate(df.iloc[fila_enc].tolist()):
        clave = _clave_columna(_norm(val))
        if clave and clave not in colmap:
            colmap[clave] = ci

    if "titulo" not in colmap:
        base["error"] = "No se encontró la columna 'NOMBRE DE LA ACTIVIDAD' en el archivo."
        return base

    datos = df.iloc[fila_enc + 1:].reset_index(drop=True)
    registros: list[dict] = []

    for _, row in datos.iterrows():
        def cell(clave):
            i = colmap.get(clave)
            if i is None or i >= len(row):
                return None
            return row.iloc[i]

        titulo = _limpia(cell("titulo"))
        if not titulo:
            continue

        lugar = _limpia(cell("lugar"))
        direccion = _limpia(cell("direccion"))
        if lugar and direccion:
            lugar_full = f"{lugar} — {direccion}"
        else:
            lugar_full = lugar or direccion or "CDC - Bogotá D.C."

        fi = _parse_fecha(cell("fecha_inicio")) or fecha_inicio_default
        ff = _parse_fecha(cell("fecha_fin")) or fecha_fin_default
        if ff and ff < fi:
            ff = None

        partes = []
        for clave, etiqueta in _DESC_CAMPOS:
            v = _limpia(cell(clave))
            if v:
                partes.append(f"{etiqueta}: {v}")
        descripcion = " | ".join(partes)[:1000] or None

        registros.append({
            "titulo":       titulo[:500],
            "lugar":        lugar_full[:600],
            "tipo":         TIPO_CDC,
            "organizador":  ORGANIZADOR_CDC,
            "fecha_inicio": fi,
            "fecha_fin":    ff,
            "descripcion":  descripcion,
        })

    base["filas_procesadas"] = len(registros)
    base["muestra"] = [
        {
            "titulo":    r["titulo"],
            "lugar":     r["lugar"][:80] + ("…" if len(r["lugar"]) > 80 else ""),
            "tipo":      r["tipo"],
            "localidad": nombre_localidad,
        }
        for r in registros[:10]
    ]

    if not registros:
        base["error"] = "No se encontraron actividades válidas en el archivo."
        return base

    if not dry_run:
        nuevas = [
            Actividad(
                titulo=r["titulo"],
                descripcion=r["descripcion"],
                lugar=r["lugar"],
                tipo=r["tipo"],
                organizador=r["organizador"],
                localidad_id=localidad_obj.id,
                fecha_inicio=r["fecha_inicio"],
                fecha_fin=r["fecha_fin"],
            )
            for r in registros
        ]
        db.add_all(nuevas)
        db.commit()
        base["insertados"] = len(nuevas)

    return base
