  # ── Imagen base ──────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# ── Dependencias Node ─────────────────────────────────────────────────────────
COPY package*.json ./
RUN npm ci

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

# ── Expone el puerto del servidor de desarrollo de Vite ───────────────────────
EXPOSE 5173

# Vite debe escuchar en 0.0.0.0 para ser accesible desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]