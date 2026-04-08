from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.dependencies import get_current_user
from app.services.etl import procesar_excel

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/upload")
def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not file.filename.endswith((".xlsx", ".csv")):
        raise HTTPException(
            status_code=400,
            detail="Solo se aceptan archivos .xlsx o .csv",
        )

    contenido = file.file.read()
    resultado = procesar_excel(contenido, file.filename, db)
    return resultado
