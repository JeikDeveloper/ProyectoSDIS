"""
ETL para el archivo PORTAFOLIO DE FORMACIÓN SENA - REGIONAL DISTRITO CAPITAL.

Procesa 4 hojas:
  - TITULADA PRESENCIAL      (skip=3, 16 cols)
  - TITULADA VIRTUAL         (skip=2,  7 cols)
  - COMPLEMENTARIA VIRTUAL   (skip=2,  6 cols)
  - COMPLEMENTARIA PRESENCIAL(skip=3, 13 cols)
"""

import io
import math
import re
from datetime import date
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models.actividad import Actividad
from app.models.localidad import Localidad


# ---------------------------------------------------------------------------
# Configuración por hoja: cada entrada en "cols" mapea nombre_campo → col_idx
# ---------------------------------------------------------------------------
HOJAS = [
    {
        "nombre": "TITULADA PRESENCIAL",
        "skip":   3,    # fila 0=título, 1=encabezado principal, 2=sub-encabezado
        "tipo":   "Taller",
        "ffill":  [0, 1, 2],
        "cols": {
            "titulo":                    6,   # G: PROGRAMA DE FORMACIÓN
            "lugar":                     0,   # A: CENTRO DE FORMACIÓN
            "red_sena":                  1,   # B: RED DE CONOCIMIENTO
            "nivel_sena":                2,   # C: NIVEL
            "codigo_sena":               3,   # D: CODIGO
            "version_sena":              4,   # E: VERSION
            "iniciativas_sena":          5,   # F: INICIATIVAS
            "duracion_lectiva_meses":    7,   # H: DURACIÓN LECTIVA MESES
            "duracion_lectiva_horas":    8,   # I: DURACIÓN LECTIVA HORAS
            "duracion_productiva_meses": 9,   # J: DURACIÓN PRODUCTIVA MESES
            "duracion_productiva_horas": 10,  # K: DURACIÓN PRODUCTIVA HORAS
            "duracion_total_meses":      11,  # L: DURACIÓN TOTAL MESES
            "duracion_total_horas":      12,  # M: DURACIÓN TOTAL HORAS
            "requisitos_sena":           13,  # N: REQUISITOS
            "campana_sena":              15,  # P: CAMPAÑA (CAMPESENA / FULLPOPULAR)
        },
    },
    {
        "nombre": "TITULADA VIRTUAL",
        "skip":   2,    # fila 0=título, 1=encabezado
        "tipo":   "Taller",
        "ffill":  [0, 1],
        "cols": {
            "titulo":              4,   # E: PROGRAMA DE FORMACIÓN
            "lugar":               0,   # A: CENTRO DE FORMACIÓN
            "red_sena":            1,   # B: RED DE CONOCIMIENTO
            "codigo_sena":         2,   # C: CÓDIGO EN SOFIA
            "version_sena":        3,   # D: VERSION
            "duracion_texto_sena": 5,   # F: DURACIÓN ("27 meses")
            "requisitos_sena":     6,   # G: REQUISITOS
        },
    },
    {
        "nombre": "COMPLEMENTARIA VIRTUAL",
        "skip":   2,
        "tipo":   "Actividad",
        "ffill":  [0, 1],
        "cols": {
            "titulo":               2,  # C: PROGRAMA
            "lugar":                0,  # A: CENTRO DE FORMACIÓN
            "red_sena":             1,  # B: FAMILIA (reusa campo red_sena)
            "codigo_sena":          3,  # D: CÓDIGO SOFIA
            "version_sena":         4,  # E: VERSION
            "duracion_total_horas": 5,  # F: DURACIÓN (horas numéricas)
        },
    },
    {
        "nombre": "COMPLEMENTARIA PRESENCIAL",
        "skip":   3,    # fila 0=título, 1=vacía, 2=encabezado
        "tipo":   "Actividad",
        "ffill":  [0, 1],
        "cols": {
            "titulo":               5,  # F: PROGRAMA DE FORMACIÓN
            "lugar":                0,  # A: CENTRO DE FORMACIÓN
            "red_sena":             1,  # B: RED DE CONOCIMIENTO
            "nivel_sena":           2,  # C: NIVEL
            "codigo_sena":          3,  # D: CODIGO
            "version_sena":         4,  # E: VERSION
            "iniciativas_sena":     6,  # G: INICIATIVAS
            "estado_sofia":         7,  # H: ESTADO ACTUAL EN SOFIA
            "duracion_total_horas": 8,  # I: DURACIÓN EN HORAS
            "requisitos_sena":      9,  # J: REQUISITOS
            "campana_sena":         12, # M: CAMPAÑA
        },
    },
]

# Campos que se formatean como número (Float en el modelo)
_CAMPOS_NUMERICOS = {
    "duracion_lectiva_meses", "duracion_lectiva_horas",
    "duracion_productiva_meses", "duracion_productiva_horas",
    "duracion_total_meses", "duracion_total_horas",
}

# Campos incluidos en la descripción resumida para el frontend
_DESC_CAMPOS = [
    ("nivel_sena",          "Nivel"),
    ("red_sena",            "Red"),
    ("codigo_sena",         "Código"),
    ("duracion_total_horas","Horas"),
    ("duracion_texto_sena", "Duración"),
    ("requisitos_sena",     "Requisitos"),
]


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

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


def _primera_linea_raw(val) -> Optional[str]:
    """Primera línea del valor crudo de celda (antes de normalizar espacios)."""
    if val is None:
        return None
    if isinstance(val, float):
        try:
            if math.isnan(val):
                return None
        except Exception:
            pass
    primera = str(val).split("\n")[0].split("\r")[0].strip()
    return re.sub(r"\s+", " ", primera).strip() or None


def _num(val) -> Optional[float]:
    """Convierte a float; None si NaN o no numérico."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Procesador de una hoja
# ---------------------------------------------------------------------------

def _procesar_hoja(df_raw: pd.DataFrame, cfg: dict) -> list[dict]:
    df = df_raw.iloc[cfg["skip"]:].copy().reset_index(drop=True)

    for idx in cfg.get("ffill", []):
        if idx < df.shape[1]:
            df.iloc[:, idx] = df.iloc[:, idx].ffill()

    cols = cfg["cols"]
    registros = []

    for _, row in df.iterrows():
        n = len(row)

        def raw(i):
            return row.iloc[i] if i < n else None

        # Título — fila inválida si está vacío
        titulo_col = cols["titulo"]
        titulo = _limpia(raw(titulo_col))
        if not titulo:
            continue

        # Lugar — primera línea del texto crudo (evita unir varias centros)
        lugar_col = cols["lugar"]
        lugar = _primera_linea_raw(raw(lugar_col)) or "SENA - Bogotá D.C."

        rec: dict = {
            "titulo":      titulo[:200],
            "lugar":       lugar[:300],
            "tipo":        cfg["tipo"],
            "organizador": "SENA",
            "hoja_sena":   cfg["nombre"],
        }

        for campo, col_idx in cols.items():
            if campo in ("titulo", "lugar"):
                continue
            val_raw = raw(col_idx)
            if campo in _CAMPOS_NUMERICOS:
                rec[campo] = _num(val_raw)
            else:
                v = _limpia(val_raw)
                if v:
                    limite = 2000 if campo == "requisitos_sena" else 300
                    rec[campo] = v[:limite]

        # Descripción resumida para el frontend (primer campo vacío = omitido)
        partes = []
        for campo, etiqueta in _DESC_CAMPOS:
            v = rec.get(campo)
            if v is not None:
                partes.append(f"{etiqueta}: {v}")
        rec["descripcion"] = " | ".join(partes)[:1000] or None

        registros.append(rec)

    return registros


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------

def procesar_sena(
    contenido: bytes,
    nombre_localidad: str,
    fecha_inicio: date,
    fecha_fin: Optional[date],
    db: Session,
    dry_run: bool = False,
) -> dict:
    """
    Parsea el portafolio SENA y, si dry_run=False, inserta en la BD.

    Retorna:
      { error, insertados, filas_procesadas, filas_con_error, errores, muestra }
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
    except Exception as exc:
        base["error"] = f"No se pudo leer el archivo Excel: {exc}"
        return base

    nombres_en_archivo = xls.sheet_names
    todos_registros: list[dict] = []
    errores_formato: list[dict] = []

    for cfg in HOJAS:
        hoja_real = next(
            (s for s in nombres_en_archivo if s.strip() == cfg["nombre"].strip()), None
        )
        if not hoja_real:
            errores_formato.append(
                {"fila": f"Hoja '{cfg['nombre']}'", "errores": ["Hoja no encontrada en el archivo"]}
            )
            continue

        try:
            df_raw = pd.read_excel(xls, sheet_name=hoja_real, header=None)
        except Exception as exc:
            errores_formato.append(
                {"fila": f"Hoja '{hoja_real}'", "errores": [f"No se pudo leer: {exc}"]}
            )
            continue

        registros = _procesar_hoja(df_raw, cfg)
        todos_registros.extend(registros)

    if len(errores_formato) == len(HOJAS):
        base["error"] = (
            "El archivo no tiene el formato SENA esperado. "
            "Verifica que sea el Portafolio de Formación Regional."
        )
        base["filas_con_error"] = len(errores_formato)
        base["errores"] = errores_formato
        return base

    base["filas_procesadas"] = len(todos_registros)
    base["filas_con_error"] = len(errores_formato)
    base["errores"] = errores_formato

    base["muestra"] = [
        {
            "titulo":  r["titulo"],
            "lugar":   r["lugar"][:80] + ("…" if len(r["lugar"]) > 80 else ""),
            "tipo":    r["tipo"],
            "hoja":    r["hoja_sena"],
            "codigo":  r.get("codigo_sena", ""),
        }
        for r in todos_registros[:10]
    ]

    if not todos_registros:
        base["error"] = "No se encontraron programas válidos en el archivo."
        return base

    if not dry_run:
        nuevas = [
            Actividad(
                titulo=r["titulo"],
                descripcion=r.get("descripcion"),
                lugar=r["lugar"],
                tipo=r["tipo"],
                organizador=r["organizador"],
                localidad_id=localidad_obj.id,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                hoja_sena=r.get("hoja_sena"),
                codigo_sena=r.get("codigo_sena"),
                version_sena=r.get("version_sena"),
                nivel_sena=r.get("nivel_sena"),
                red_sena=r.get("red_sena"),
                iniciativas_sena=r.get("iniciativas_sena"),
                estado_sofia=r.get("estado_sofia"),
                campana_sena=r.get("campana_sena"),
                duracion_lectiva_meses=r.get("duracion_lectiva_meses"),
                duracion_lectiva_horas=r.get("duracion_lectiva_horas"),
                duracion_productiva_meses=r.get("duracion_productiva_meses"),
                duracion_productiva_horas=r.get("duracion_productiva_horas"),
                duracion_total_meses=r.get("duracion_total_meses"),
                duracion_total_horas=r.get("duracion_total_horas"),
                duracion_texto_sena=r.get("duracion_texto_sena"),
                requisitos_sena=r.get("requisitos_sena"),
            )
            for r in todos_registros
        ]
        db.add_all(nuevas)
        db.commit()
        base["insertados"] = len(nuevas)

    return base
