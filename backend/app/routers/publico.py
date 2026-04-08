from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.actividad import Actividad
from app.models.localidad import Localidad
from app.schemas.actividad import ActividadResponse, LocalidadResponse

router = APIRouter(tags=["público"])


@router.get("/localidades", response_model=List[LocalidadResponse])
def get_localidades(db: Session = Depends(get_db)):
    return db.query(Localidad).order_by(Localidad.codigo).all()


@router.get("/actividades", response_model=List[ActividadResponse])
def get_actividades(
    localidad: str = Query(..., description="Nombre exacto de la localidad"),
    db: Session = Depends(get_db),
):
    loc = db.query(Localidad).filter(Localidad.nombre == localidad).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Localidad '{localidad}' no encontrada")

    actividades = (
        db.query(Actividad)
        .filter(Actividad.localidad_id == loc.id)
        .options(joinedload(Actividad.localidad))
        .order_by(Actividad.fecha_inicio)
        .all()
    )

    return [
        ActividadResponse(
            id=a.id,
            titulo=a.titulo,
            descripcion=a.descripcion,
            localidad=a.localidad.nombre,
            lugar=a.lugar,
            fecha_inicio=a.fecha_inicio,
            fecha_fin=a.fecha_fin,
            hora_inicio=a.hora_inicio,
            hora_fin=a.hora_fin,
            tipo=a.tipo,
            organizador=a.organizador,
            fecha_carga=a.fecha_carga,
        )
        for a in actividades
    ]
