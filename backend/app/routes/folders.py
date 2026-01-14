from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import SessionLocal
from app.core.deps import get_current_user
from app.models.folder import Folder
from app.models.user import User
from app.schemas.folder import FolderCreate

router = APIRouter(prefix="/folders", tags=["Folders"])


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
# LIST folders (My Drive / Subfolders) ✅ FIXED
# -------------------------
@router.get("")
def list_folders(
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List folders for the logged-in user.

    - If parent_id is NULL → return root folders only
    - If parent_id is provided → return only its direct children
    """

    query = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
    )

    if parent_id is None:
        query = query.filter(Folder.parent_id.is_(None))
    else:
        query = query.filter(Folder.parent_id == parent_id)

    folders = query.order_by(Folder.id.desc()).all()
    return folders


# -------------------------
# Create a new folder
# -------------------------
@router.post("")
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a folder for the logged-in user.
    Supports nested folders via parent_id.
    """

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
# Get a folder (owner only)
# -------------------------
@router.get("/{folder_id}")
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a folder only if:
    - It belongs to the logged-in user
    - It is not deleted
    """

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
    ).first()

    if not folder:
        return None

    return folder


# -------------------------
# Soft delete a folder (Trash)
# -------------------------
@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a folder.
    Folder is NOT removed from DB.
    """

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder.is_deleted = True
    db.commit()

    return {"message": "Folder moved to trash"}
