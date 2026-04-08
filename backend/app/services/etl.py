import io
import pandas as pd
from sqlalchemy.orm import Session

from app.models.actividad import Actividad
from app.models.localidad import Localidad

LOCALIDADES_VALIDAS = {
    "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme",
    "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba",
    "Barrios Unidos", "Teusaquillo", "Los Mártires", "Antonio Nariño",
    "Puente Aranda", "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
}

TIPOS_VALIDOS = {"Taller", "Evento", "Actividad"}
ORGANIZADORES_VALIDOS = {"Secretaría", "SENA", "Otro"}

COLUMNAS_REQUERIDAS = {"titulo", "localidad", "lugar", "fecha_inicio", "tipo", "organizador"}


def procesar_excel(contenido: bytes, nombre_archivo: str, db: Session) -> dict:
    try:
        if nombre_archivo.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contenido))
        else:
            df = pd.read_excel(io.BytesIO(contenido))
    except Exception as e:
        return {"error": f"No se pudo leer el archivo: {e}", "insertados": 0, "errores": []}

    df.columns = [str(c).strip().lower() for c in df.columns]

    faltantes = COLUMNAS_REQUERIDAS - set(df.columns)
    if faltantes:
        return {
            "error": f"Columnas faltantes en el archivo: {', '.join(sorted(faltantes))}",
            "insertados": 0,
            "errores": [],
        }

    errores = []
    nuevas_actividades = []

    for idx, row in df.iterrows():
        fila_num = idx + 2  # fila 1 = encabezado
        fila_errores = []

        titulo = str(row.get("titulo", "")).strip()
        if not titulo:
            fila_errores.append("'titulo' está vacío")

        nombre_localidad = str(row.get("localidad", "")).strip()
        if nombre_localidad not in LOCALIDADES_VALIDAS:
            fila_errores.append(f"Localidad '{nombre_localidad}' no es válida")

        lugar = str(row.get("lugar", "")).strip()
        if not lugar:
            fila_errores.append("'lugar' está vacío")

        tipo = str(row.get("tipo", "")).strip()
        if tipo not in TIPOS_VALIDOS:
            fila_errores.append(f"'tipo' debe ser: Taller, Evento o Actividad (recibido: '{tipo}')")

        organizador = str(row.get("organizador", "")).strip()
        if organizador not in ORGANIZADORES_VALIDOS:
            fila_errores.append(
                f"'organizador' debe ser: Secretaría, SENA u Otro (recibido: '{organizador}')"
            )

        fecha_inicio = None
        try:
            fecha_inicio = pd.to_datetime(row.get("fecha_inicio"), dayfirst=True).date()
        except Exception:
            fila_errores.append("'fecha_inicio' inválida — use formato DD/MM/YYYY")

        fecha_fin = None
        if pd.notna(row.get("fecha_fin", None)):
            try:
                fecha_fin = pd.to_datetime(row.get("fecha_fin"), dayfirst=True).date()
                if fecha_inicio and fecha_fin < fecha_inicio:
                    fila_errores.append("'fecha_fin' debe ser mayor o igual a 'fecha_inicio'")
            except Exception:
                fila_errores.append("'fecha_fin' inválida — use formato DD/MM/YYYY")

        hora_inicio = None
        if pd.notna(row.get("hora_inicio", None)):
            try:
                hora_inicio = pd.to_datetime(str(row.get("hora_inicio")), format="%H:%M").time()
            except Exception:
                fila_errores.append("'hora_inicio' inválida — use formato HH:MM")

        hora_fin = None
        if pd.notna(row.get("hora_fin", None)):
            try:
                hora_fin = pd.to_datetime(str(row.get("hora_fin")), format="%H:%M").time()
                if hora_inicio and hora_fin <= hora_inicio:
                    fila_errores.append("'hora_fin' debe ser mayor que 'hora_inicio'")
            except Exception:
                fila_errores.append("'hora_fin' inválida — use formato HH:MM")

        descripcion = None
        if pd.notna(row.get("descripcion", None)):
            descripcion = str(row.get("descripcion")).strip()[:1000]

        if fila_errores:
            errores.append({"fila": fila_num, "errores": fila_errores})
            continue

        localidad = db.query(Localidad).filter(Localidad.nombre == nombre_localidad).first()
        if not localidad:
            errores.append({"fila": fila_num, "errores": [f"Localidad '{nombre_localidad}' no encontrada en la base de datos"]})
            continue

        nuevas_actividades.append(
            Actividad(
                titulo=titulo,
                descripcion=descripcion,
                localidad_id=localidad.id,
                lugar=lugar,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                tipo=tipo,
                organizador=organizador,
            )
        )

    if nuevas_actividades:
        db.add_all(nuevas_actividades)
        db.commit()

    return {
        "insertados": len(nuevas_actividades),
        "filas_con_error": len(errores),
        "errores": errores,
    }
