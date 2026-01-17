from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import os

from supabase import create_client

from app.core.database import SessionLocal
from app.core.deps import get_current_user
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.models.link_share import LinkShare  # ✅ NEW
from app.schemas.folder import FolderCreate

router = APIRouter(prefix="/folders", tags=["Folders"])


# -------------------------
# Supabase client (shared)
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


# -------------------------
# Database dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# Helper: get subfolders recursively
# -------------------------
def get_subfolders(db: Session, owner_id: int, parent_id: int) -> List[Folder]:
    children = db.query(Folder).filter(
        Folder.owner_id == owner_id,
        Folder.parent_id == parent_id,
    ).all()

    result = []
    for child in children:
        result.append(child)
        result.extend(get_subfolders(db, owner_id, child.id))

    return result


# -------------------------
# Helper: permanently delete files in a folder
# -------------------------
def permanently_delete_files(db: Session, owner_id: int, folder_id: int):
    files = db.query(File).filter(
        File.owner_id == owner_id,
        File.folder_id == folder_id,
    ).all()

    for file in files:
        if file.storage_path:
            supabase.storage.from_("files").remove([file.storage_path])
        db.delete(file)


# -------------------------
# Helper: permanently delete folder shares ✅ NEW
# -------------------------
def permanently_delete_folder_shares(db: Session, folder_id: int):
    db.query(LinkShare).filter(
        LinkShare.folder_id == folder_id
    ).delete(synchronize_session=False)


# -------------------------
# LIST folders (Drive)
# -------------------------
@router.get("")
def list_folders(
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
    )

    if parent_id is None:
        query = query.filter(Folder.parent_id.is_(None))
    else:
        query = query.filter(Folder.parent_id == parent_id)

    return query.order_by(Folder.id.desc()).all()


# -------------------------
# LIST folders in Trash
# -------------------------
@router.get("/trash")
def list_trash_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted_folders = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True,
    ).all()

    visible_in_trash = []

    for folder in deleted_folders:
        if folder.parent_id is None:
            visible_in_trash.append(folder)
        else:
            parent = db.query(Folder).filter(
                Folder.id == folder.parent_id
            ).first()

            if parent and parent.is_deleted is False:
                visible_in_trash.append(folder)

    return sorted(visible_in_trash, key=lambda f: f.created_at, reverse=True)


# -------------------------
# CREATE folder
# -------------------------
@router.post("")
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = Folder(
        name=data.name,
        parent_id=data.parent_id,
        owner_id=current_user.id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


# -------------------------
# GET folder
# -------------------------
@router.get("/{folder_id}")
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
    ).first()

    if not folder:
        return None

    return folder


# -------------------------
# DELETE folder (soft, recursive)
# -------------------------
@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    subfolders = get_subfolders(db, current_user.id, folder.id)

    db.query(File).filter(
        File.owner_id == current_user.id,
        File.folder_id == folder.id,
    ).update({File.is_deleted: True})

    for sub in subfolders:
        sub.is_deleted = True
        db.query(File).filter(
            File.owner_id == current_user.id,
            File.folder_id == sub.id,
        ).update({File.is_deleted: True})

    folder.is_deleted = True
    db.commit()

    return {"message": "Folder moved to trash"}


# -------------------------
# RESTORE folder (recursive)
# -------------------------
@router.post("/{folder_id}/restore")
def restore_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True,
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    subfolders = get_subfolders(db, current_user.id, folder.id)

    folder.is_deleted = False
    db.query(File).filter(
        File.owner_id == current_user.id,
        File.folder_id == folder.id,
    ).update({File.is_deleted: False})

    for sub in subfolders:
        sub.is_deleted = False
        db.query(File).filter(
            File.owner_id == current_user.id,
            File.folder_id == sub.id,
        ).update({File.is_deleted: False})

    db.commit()
    return {"message": "Folder restored"}


# -------------------------
# PERMANENT DELETE folder (recursive, DB + storage)
# -------------------------
@router.delete("/{folder_id}/permanent")
def permanently_delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True,
    ).first()

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found in trash",
        )

    subfolders = get_subfolders(db, current_user.id, folder.id)

    # 🔥 DELETE SUBFOLDERS FIRST
    for sub in subfolders:
        permanently_delete_folder_shares(db, sub.id)
        permanently_delete_files(db, current_user.id, sub.id)
        db.delete(sub)

    # 🔥 DELETE ROOT FOLDER SHARES
    permanently_delete_folder_shares(db, folder.id)

    # 🔥 DELETE ROOT FOLDER FILES
    permanently_delete_files(db, current_user.id, folder.id)

    # 🔥 DELETE ROOT FOLDER
    db.delete(folder)

    db.commit()
    return {"message": "Folder permanently deleted"}
