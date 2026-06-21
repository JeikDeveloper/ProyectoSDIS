"""
Migración: ampliar la longitud de las columnas VARCHAR.

`create_all` NO modifica tablas existentes, así que en una BD que ya existía
(p. ej. el MySQL de producción) hay que ALTERar las columnas a mano para que
coincidan con las nuevas longitudes del modelo y no falle con "Data too long".

Uso (en el servidor, con el .env apuntando a la BD a migrar):
    python migrate_ampliar_columnas.py

- En MySQL ejecuta los ALTER TABLE ... MODIFY.
- En SQLite no hace nada (SQLite ignora la longitud de los VARCHAR).
Es idempotente: re-ejecutarlo no causa problemas.
"""

from sqlalchemy import text

from app.database import engine

# (tabla, columna, definición nueva)  — coincide con los modelos
CAMBIOS = [
    ("actividades", "titulo",              "VARCHAR(500) NOT NULL"),
    ("actividades", "lugar",               "VARCHAR(600) NOT NULL"),
    ("actividades", "tipo",                "VARCHAR(100) NOT NULL"),
    ("actividades", "organizador",         "VARCHAR(200) NOT NULL"),
    ("actividades", "hoja_sena",           "VARCHAR(150) NULL"),
    ("actividades", "codigo_sena",         "VARCHAR(120) NULL"),
    ("actividades", "version_sena",        "VARCHAR(300) NULL"),
    ("actividades", "nivel_sena",          "VARCHAR(250) NULL"),
    ("actividades", "red_sena",            "VARCHAR(600) NULL"),
    ("actividades", "iniciativas_sena",    "VARCHAR(600) NULL"),
    ("actividades", "estado_sofia",        "VARCHAR(200) NULL"),
    ("actividades", "campana_sena",        "VARCHAR(200) NULL"),
    ("actividades", "duracion_texto_sena", "VARCHAR(200) NULL"),
    ("localidades", "nombre",              "VARCHAR(200) NOT NULL"),
    ("usuarios",    "nombre_usuario",      "VARCHAR(200) NOT NULL"),
]


def main():
    dialecto = engine.dialect.name
    print(f"Dialecto detectado: {dialecto}")

    if dialecto == "sqlite":
        print("SQLite ignora la longitud de los VARCHAR — no se requiere migración.")
        return

    if dialecto != "mysql":
        print(f"Dialecto '{dialecto}' no contemplado. Genera los ALTER manualmente:")
        for tabla, col, definicion in CAMBIOS:
            print(f"  ALTER TABLE {tabla} MODIFY {col} {definicion};")
        return

    with engine.begin() as conn:
        for tabla, col, definicion in CAMBIOS:
            sql = f"ALTER TABLE {tabla} MODIFY {col} {definicion}"
            print(f"  {sql}")
            conn.execute(text(sql))

    print("Migración completada: columnas ampliadas correctamente.")


if __name__ == "__main__":
    main()
