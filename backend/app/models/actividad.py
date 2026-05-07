from sqlalchemy import Column, Integer, String, Text, Date, Time, ForeignKey, DateTime, Float, func
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

    # ── Campos exclusivos SENA (null para actividades de Secretaría) ──────────
    hoja_sena                = Column(String(60),  nullable=True)  # hoja del portafolio
    codigo_sena              = Column(String(50),  nullable=True)  # código SOFIA
    version_sena             = Column(String(20),  nullable=True)  # versión del programa
    nivel_sena               = Column(String(100), nullable=True)  # TÉCNICO / TECNÓLOGO / etc.
    red_sena                 = Column(String(300), nullable=True)  # red de conocimiento / familia
    iniciativas_sena         = Column(String(300), nullable=True)  # iniciativas asociadas
    estado_sofia             = Column(String(100), nullable=True)  # estado en sistema SOFIA
    campana_sena             = Column(String(100), nullable=True)  # etiqueta de campaña
    duracion_lectiva_meses   = Column(Float, nullable=True)        # TITULADA PRESENCIAL col H
    duracion_lectiva_horas   = Column(Float, nullable=True)        # TITULADA PRESENCIAL col I
    duracion_productiva_meses= Column(Float, nullable=True)        # TITULADA PRESENCIAL col J
    duracion_productiva_horas= Column(Float, nullable=True)        # TITULADA PRESENCIAL col K
    duracion_total_meses     = Column(Float, nullable=True)        # TITULADA PRESENCIAL col L
    duracion_total_horas     = Column(Float, nullable=True)        # horas totales (varias hojas)
    duracion_texto_sena      = Column(String(100), nullable=True)  # TITULADA VIRTUAL "27 meses"
    requisitos_sena          = Column(Text, nullable=True)         # requisitos de admisión
