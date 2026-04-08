from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional


class ActividadResponse(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str] = None
    localidad: str
    lugar: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    tipo: str
    organizador: str
    fecha_carga: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LocalidadResponse(BaseModel):
    id: int
    nombre: str
    codigo: int

    model_config = {"from_attributes": True}
