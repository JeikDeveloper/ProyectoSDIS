from contextlib import contextmanager
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.usuario import Usuario
from app.services.etl import procesar_excel, procesar_secretaria
from app.services.etl_sena import procesar_sena
from app.services.etl_cdc import procesar_cdc

router = APIRouter(prefix="/admin", tags=["admin"])

FORMATOS_PERMITIDOS = (".xlsx", ".csv")


def _validar_extension(nombre: str):
    if not any(nombre.endswith(ext) for ext in FORMATOS_PERMITIDOS):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx o .csv")


@contextmanager
def _errores_de_carga(db: Session):
    """Convierte cualquier excepción de la carga (incl. errores de BD) en una
    respuesta JSON con el motivo real, en vez de un 500 opaco."""
    try:
        yield
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        mensaje = str(getattr(exc, "orig", exc)).strip() or str(exc)
        raise HTTPException(status_code=400, detail=f"Error al cargar los datos: {mensaje}")


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
    with _errores_de_carga(db):
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

    with _errores_de_carga(db):
        return procesar_sena(file.file.read(), localidad, fi, ff, db, dry_run=False)


# ---------------------------------------------------------------------------
# CDC (Centros de Desarrollo Comunitario): validar y cargar
# ---------------------------------------------------------------------------

def _parse_fechas_cdc(fecha_inicio: str, fecha_fin: Optional[str]):
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
    return fi, ff


@router.post("/cdc/preview")
def preview_cdc(
    file: UploadFile = File(...),
    localidad: str = Form(...),
    fecha_inicio: str = Form(...),
    fecha_fin: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Valida la oferta CDC y devuelve preview sin insertar."""
    _validar_extension(file.filename)
    fi, ff = _parse_fechas_cdc(fecha_inicio, fecha_fin)
    return procesar_cdc(file.file.read(), localidad, fi, ff, db, dry_run=True)


@router.post("/cdc/upload")
def upload_cdc(
    file: UploadFile = File(...),
    localidad: str = Form(...),
    fecha_inicio: str = Form(...),
    fecha_fin: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Inserta las actividades CDC en la BD."""
    _validar_extension(file.filename)
    fi, ff = _parse_fechas_cdc(fecha_inicio, fecha_fin)
    with _errores_de_carga(db):
        return procesar_cdc(file.file.read(), localidad, fi, ff, db, dry_run=False)
