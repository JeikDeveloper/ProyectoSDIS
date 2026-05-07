"""
Migración: agrega columnas SENA a la tabla actividades.
Ejecutar una sola vez:
    cd backend
    python migrate_sena_cols.py
"""
from sqlalchemy import text
from app.database import engine

NUEVAS_COLUMNAS = [
    "ALTER TABLE actividades ADD COLUMN hoja_sena VARCHAR(60)",
    "ALTER TABLE actividades ADD COLUMN codigo_sena VARCHAR(50)",
    "ALTER TABLE actividades ADD COLUMN version_sena VARCHAR(20)",
    "ALTER TABLE actividades ADD COLUMN nivel_sena VARCHAR(100)",
    "ALTER TABLE actividades ADD COLUMN red_sena VARCHAR(300)",
    "ALTER TABLE actividades ADD COLUMN iniciativas_sena VARCHAR(300)",
    "ALTER TABLE actividades ADD COLUMN estado_sofia VARCHAR(100)",
    "ALTER TABLE actividades ADD COLUMN campana_sena VARCHAR(100)",
    "ALTER TABLE actividades ADD COLUMN duracion_lectiva_meses REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_lectiva_horas REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_productiva_meses REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_productiva_horas REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_total_meses REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_total_horas REAL",
    "ALTER TABLE actividades ADD COLUMN duracion_texto_sena VARCHAR(100)",
    "ALTER TABLE actividades ADD COLUMN requisitos_sena TEXT",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for stmt in NUEVAS_COLUMNAS:
            col = stmt.split("ADD COLUMN ")[1].split(" ")[0]
            try:
                conn.execute(text(stmt))
                print(f"  + {col}")
            except Exception:
                print(f"  ~ {col} (ya existe)")
        conn.commit()
    print("Migración completada.")
