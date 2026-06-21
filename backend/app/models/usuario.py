from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_usuario = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # hash bcrypt (60 chars), 255 sobra
    activo = Column(Boolean, default=True)
