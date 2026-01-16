from fastapi import APIRouter, Depends, UploadFile, File as FastFile, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import uuid4
import os
import io

from supabase import create_client

from app.core.database import SessionLocal
from app.core.deps import get_current_user
from app.models.file import File
from app.models.user import User
from app.schemas.file import FileOut

# --------------------
# Supabase
# --------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

router = APIRouter(prefix="/files", tags=["Files"])


# --------------------
# DB dependency
# --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------
# GET FILES
# --------------------
@router.get("", response_model=List[FileOut])
def get_files(
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(File).filter(
        File.owner_id == current_user.id,
        File.is_deleted == False,
        File.is_uploaded == True,
    )

    if folder_id is not None:
        query = query.filter(File.folder_id == folder_id)
    else:
        query = query.filter(File.folder_id.is_(None))

    return query.order_by(File.created_at.desc()).all()


# --------------------
# UPLOAD FILE
# --------------------
@router.post("/upload")
async def upload_file(
    file: UploadFile = FastFile(...),
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")

    storage_path = f"{current_user.id}/{uuid4()}_{file.filename}"
    file_bytes = await file.read()

    res = supabase.storage.from_("files").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": file.content_type},
    )

    if isinstance(res, dict) and res.get("error"):
        raise HTTPException(status_code=500, detail=res["error"]["message"])

    db_file = File(
        name=file.filename,
        owner_id=current_user.id,
        folder_id=folder_id,
        storage_path=storage_path,
        size=len(file_bytes),
        mime_type=file.content_type,
        is_uploaded=True,
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {
        "id": db_file.id,
        "name": db_file.name,
        "storage_path": storage_path,
    }


# --------------------
# DOWNLOAD / PREVIEW FILE ✅ FIX
# --------------------
@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id,
        File.is_deleted == False,
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Download file bytes from Supabase
    res = supabase.storage.from_("files").download(file.storage_path)

    if res is None:
        raise HTTPException(
            status_code=404, detail="File not found in storage")

    return StreamingResponse(
        io.BytesIO(res),
        media_type=file.mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{file.name}"'
        },
    )


# --------------------
# DELETE FILE (SOFT DELETE)
# --------------------
@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id,
        File.is_deleted == False,
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.is_deleted = True
    db.commit()

    return {"message": "File moved to trash"}
