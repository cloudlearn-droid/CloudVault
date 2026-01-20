from fastapi import APIRouter, Depends, UploadFile, File as FastFile, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from uuid import uuid4
import os
import io

from supabase import create_client

from app.core.database import SessionLocal
from app.core.deps import get_current_user
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.file import FileOut, FileRename, FileMove

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
# GET TRASH FILES ✅ FIXED
# --------------------
@router.get("/trash", response_model=List[FileOut])
def get_trash_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trash should show:
    - Soft-deleted standalone files
    - Soft-deleted files whose parent folder is NOT deleted

    Trash should NOT show:
    - Files inside soft-deleted folders
    """

    return (
        db.query(File)
        .outerjoin(Folder, File.folder_id == Folder.id)
        .filter(
            File.owner_id == current_user.id,
            File.is_deleted == True,
            or_(
                File.folder_id.is_(None),
                Folder.is_deleted == False,
            ),
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
# PERMANENT DELETE
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

    if file.storage_path:
        supabase.storage.from_("files").remove([file.storage_path])

    db.delete(file)
    db.commit()

    return {"message": "File permanently deleted"}


# -------------------------
# RENAME
# -------------------------
@router.patch("/{file_id}/rename")
def rename_file(
    file_id: int,
    data: FileRename,
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

    dup = db.query(File).filter(
        File.owner_id == current_user.id,
        File.folder_id == file.folder_id,
        File.name == data.name,
        File.id != file.id,
        File.is_deleted == False,
    ).first()

    if dup:
        raise HTTPException(status_code=400, detail="File name already exists")

    file.name = data.name
    db.commit()
    return {"message": "File renamed"}


# -------------------------
# MOVE
# -------------------------
@router.patch("/{file_id}/move")
def move_file(
    file_id: int,
    data: FileMove,
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

    if data.folder_id is not None:
        folder = db.query(Folder).filter(
            Folder.id == data.folder_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted == False,
        ).first()
        if not folder:
            raise HTTPException(status_code=400, detail="Invalid destination")

    file.folder_id = data.folder_id
    db.commit()
    return {"message": "File moved"}
