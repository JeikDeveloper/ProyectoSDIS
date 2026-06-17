from fastapi import APIRouter, Depends, Query, HTTPException, Request, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from deepgram import DeepgramClient
from app.services.deepgram import generar_audio_actividad
from app.config import settings
from typing import List
import os


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
        raise HTTPException(
            status_code=404, detail=f"Localidad '{localidad}' no encontrada")

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


@router.post("/actividad/audio")
async def generarAudio(request: Request):
    # Recibir los datatos de la actividad
    actividad = await request.json()

    # Ruta donde puede estar alamacenado el audio del la actividad
    ruta_archivo = os.path.join(settings.AUDIO_DIR, f"{actividad['id']}.mp3")

    # Validar ya existe el audio de esa actividad
    if os.path.exists(ruta_archivo):
        return FileResponse(ruta_archivo, media_type="audio/mpeg", filename=f"{actividad['id']}.mp3")
    else:
        # Script de fecha dependiendo si exististe una fecha de inicio o fin
        fecha = f"Fecha: {actividad['fecha_inicio']} al {actividad['fecha_fin']}" if actividad.get(
            'fecha_fin') else f"Fecha: {actividad['fecha_inicio']}."

        # Script de hora dependiendo si existe un fecha de fin
        hora = f"Hora: {actividad['hora_inicio']} a {actividad['hora_fin']}" if actividad.get(
            'hora_fin') else f"Hora: {actividad['hora_inicio']}" if actividad.get('hora_inicio') else "Hora: Aun no definida."

        # Script completo
        texto = (
            f"El programa formativo que usted selecciono es: {actividad['tipo']}. "
            f"Titulo : {actividad['titulo']}. "
            f"Organizado por: {actividad['organizador']}. "
            f"Localidad: {actividad['localidad']}. "
            f"Lugar: {actividad['lugar']}. "
            f"{fecha} "
            f"{hora}"
        )

        # Creacion el audio de la actividad
        audio_actividad = await generar_audio_actividad(texto)

        # Almacenar el audio en la ruta establecida
        with open(ruta_archivo, "wb") as f:
            f.write(audio_actividad)

        return FileResponse(ruta_archivo, media_type="audio/mpeg", filename=f"{actividad['id']}.mp3")


@router.post('/transcribir')
async def transcribirAudio(audio: UploadFile = File(...)):
    try:
        deepgram = DeepgramClient(api_key=settings.DEEPGRAM_API_KEY)

        buffer_data = await audio.read()

        response = deepgram.listen.v1.media.transcribe_file(
            request=buffer_data,
            model="nova-3",
            language="es",
            smart_format=True,
            punctuate=True,
        )

        transcript = (
            response.results.channels[0]
            .alternatives[0]
            .transcript
        )
        return {"transcript": transcript}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
