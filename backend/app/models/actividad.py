from sqlalchemy import Column, Integer, String, Text, Date, Time, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    lugar = Column(String(300), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    hora_inicio = Column(Time, nullable=True)
    hora_fin = Column(Time, nullable=True)
    tipo = Column(String(50), nullable=False)          # Taller | Evento | Actividad
    organizador = Column(String(100), nullable=False)  # Secretaría | SENA | Otro
    fecha_carga = Column(DateTime, server_default=func.now())

    localidad_id = Column(Integer, ForeignKey("localidades.id"), nullable=False)
    localidad = relationship("Localidad", back_populates="actividades")
