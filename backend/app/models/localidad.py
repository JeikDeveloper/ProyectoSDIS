from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Localidad(Base):
    __tablename__ = "localidades"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), unique=True, nullable=False)
    codigo = Column(Integer, unique=True, nullable=False)

    actividades = relationship("Actividad", back_populates="localidad")
