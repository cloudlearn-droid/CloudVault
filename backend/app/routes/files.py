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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

router = APIRouter(prefix="/files", tags=["Files"])


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
# GET TRASH FILES
# --------------------
@router.get("/trash", response_model=List[FileOut])
def get_trash_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(File)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == True,
        )
        .order_by(File.created_at.desc())
        .all()
    )


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
    storage_path = f"{current_user.id}/{uuid4()}_{file.filename}"
    data = await file.read()

    supabase.storage.from_("files").upload(
        path=storage_path,
        file=data,
        file_options={"content-type": file.content_type},
    )

    db_file = File(
        name=file.filename,
        owner_id=current_user.id,
        folder_id=folder_id,
        storage_path=storage_path,
        size=len(data),
        mime_type=file.content_type,
        is_uploaded=True,
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {"id": db_file.id, "name": db_file.name}


# --------------------
# DOWNLOAD
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

    data = supabase.storage.from_("files").download(file.storage_path)

    return StreamingResponse(
        io.BytesIO(data),
        media_type=file.mime_type,
        headers={"Content-Disposition": f'inline; filename="{file.name}"'},
    )


# --------------------
# SOFT DELETE
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


# --------------------
# RESTORE
# --------------------
@router.post("/{file_id}/restore")
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id,
        File.is_deleted == True,
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.is_deleted = False
    db.commit()

    return {"message": "File restored"}


# --------------------
# PERMANENT DELETE ✅ NEW
# --------------------
@router.delete("/{file_id}/permanent")
def permanent_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id,
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # 1️⃣ Delete from Supabase storage (safe even if already missing)
    if file.storage_path:
        supabase.storage.from_("files").remove([file.storage_path])

    # 2️⃣ Delete from DB explicitly
    db.delete(file)
    db.commit()

    return {"message": "File permanently deleted"}
