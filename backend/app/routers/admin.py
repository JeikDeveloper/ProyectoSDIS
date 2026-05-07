from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services.etl import procesar_excel, procesar_secretaria
from app.services.etl_sena import procesar_sena

router = APIRouter(prefix="/admin", tags=["admin"])

FORMATOS_PERMITIDOS = (".xlsx", ".csv")


def _validar_extension(nombre: str):
    if not any(nombre.endswith(ext) for ext in FORMATOS_PERMITIDOS):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx o .csv")


# ---------------------------------------------------------------------------
# Endpoints originales (compatibilidad)
# ---------------------------------------------------------------------------

@router.post("/upload")
def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    _validar_extension(file.filename)
    return procesar_excel(file.file.read(), file.filename, db)


# ---------------------------------------------------------------------------
# Secretaría: validar y cargar
# ---------------------------------------------------------------------------

@router.post("/secretaria/preview")
def preview_secretaria(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Valida el archivo Secretaría y devuelve preview sin insertar."""
    _validar_extension(file.filename)
    return procesar_secretaria(file.file.read(), file.filename, db, dry_run=True)


@router.post("/secretaria/upload")
def upload_secretaria(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Inserta los datos del archivo Secretaría en la BD."""
    _validar_extension(file.filename)
    return procesar_secretaria(file.file.read(), file.filename, db, dry_run=False)


# ---------------------------------------------------------------------------
# SENA: validar y cargar
# ---------------------------------------------------------------------------

@router.post("/sena/preview")
def preview_sena(
    file: UploadFile = File(...),
    localidad: str = Form(...),
    fecha_inicio: str = Form(...),
    fecha_fin: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Valida el portafolio SENA y devuelve preview sin insertar."""
    _validar_extension(file.filename)
    try:
        fi = date.fromisoformat(fecha_inicio)
    except ValueError:
        raise HTTPException(status_code=400, detail="fecha_inicio inválida, use YYYY-MM-DD")

    ff = None
    if fecha_fin:
        try:
            ff = date.fromisoformat(fecha_fin)
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_fin inválida, use YYYY-MM-DD")

    return procesar_sena(file.file.read(), localidad, fi, ff, db, dry_run=True)


@router.post("/sena/upload")
def upload_sena(
    file: UploadFile = File(...),
    localidad: str = Form(...),
    fecha_inicio: str = Form(...),
    fecha_fin: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Inserta los programas SENA del portafolio en la BD."""
    _validar_extension(file.filename)
    try:
        fi = date.fromisoformat(fecha_inicio)
    except ValueError:
        raise HTTPException(status_code=400, detail="fecha_inicio inválida, use YYYY-MM-DD")

    ff = None
    if fecha_fin:
        try:
            ff = date.fromisoformat(fecha_fin)
        except ValueError:
            raise HTTPException(status_code=400, detail="fecha_fin inválida, use YYYY-MM-DD")

    return procesar_sena(file.file.read(), localidad, fi, ff, db, dry_run=False)
