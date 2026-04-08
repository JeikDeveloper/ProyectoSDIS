from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, publico, admin

app = FastAPI(
    title="Plataforma Secretaría de Bogotá / SENA",
    description="API REST para consulta de actividades y talleres por localidad",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(publico.router)
app.include_router(admin.router)


@app.get("/", tags=["raíz"])
def root():
    return {"mensaje": "Plataforma de Actividades Secretaría de Bogotá / SENA - API activa"}
