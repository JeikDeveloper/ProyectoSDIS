# ── Imagen base ──────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Evita archivos .pyc y fuerza logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Dependencias del sistema ──────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ── Dependencias Python ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

# ── Directorio para la base de datos SQLite (se monta como volumen) ───────────
RUN mkdir -p /app/db
RUN mkdir -p /opt/activities_audios

# Sobreescribe DATABASE_URL para apuntar al directorio persistido
ENV DATABASE_URL=sqlite:////app/db/plataforma_bogota.db

# ── Inicialización + arranque ─────────────────────────────────────────────────
# seed.py crea las tablas, inserta localidades y crea el usuario admin.
# Se ejecuta solo si la BD todavía no existe para no repetir la carga.
CMD ["sh", "-c", \
     "[ ! -f /app/db/plataforma_bogota.db ] && python seed.py; \
      uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"]