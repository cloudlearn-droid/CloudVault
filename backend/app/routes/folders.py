from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
import os

from supabase import create_client

from app.core.database import SessionLocal
from app.core.deps import get_current_user
from app.models.folder import Folder
from app.models.user import User
from app.models.link_share import LinkShare
from app.schemas.folder import FolderCreate, FolderMove, FolderRename

router = APIRouter(prefix="/folders", tags=["Folders"])


# -------------------------
# Supabase client
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


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
# Helper: permanently delete folder shares
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
    deleted = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True,
    ).all()

    visible = []
    for folder in deleted:
        if folder.parent_id is None:
            visible.append(folder)
        else:
            parent = db.query(Folder).filter(
                Folder.id == folder.parent_id).first()
            if parent and parent.is_deleted is False:
                visible.append(folder)

    return sorted(visible, key=lambda f: f.created_at, reverse=True)


# -------------------------
# CREATE folder
# -------------------------
@router.post("")
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dup = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.parent_id == data.parent_id,
        Folder.name == data.name,
        Folder.is_deleted == False,
    ).first()

    if dup:
        raise HTTPException(
            status_code=400, detail="Folder name already exists")

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
# RENAME
# -------------------------


@router.patch("/{folder_id}/rename")
def rename_folder(
    folder_id: int,
    data: FolderRename,
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

    dup = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.parent_id == folder.parent_id,
        Folder.name == data.name,
        Folder.id != folder.id,
        Folder.is_deleted == False,
    ).first()

    if dup:
        raise HTTPException(
            status_code=400, detail="Folder name already exists")

    folder.name = data.name
    db.commit()
    return {"message": "Folder renamed"}


# -------------------------
# MOVE
# -------------------------
@router.patch("/{folder_id}/move")
def move_folder(
    folder_id: int,
    data: FolderMove,
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

    # prevent self move
    if data.parent_id == folder.id:
        raise HTTPException(status_code=400, detail="Invalid move target")

    # prevent move into child
    children = get_subfolders(db, current_user.id, folder.id)
    if data.parent_id in [c.id for c in children]:
        raise HTTPException(status_code=400, detail="Cannot move into child")

    # prevent move into deleted folder
    if data.parent_id is not None:
        parent = db.query(Folder).filter(
            Folder.id == data.parent_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted == False,
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Invalid destination")

    folder.parent_id = data.parent_id
    db.commit()
    return {"message": "Folder moved"}

# -------------------------
# SOFT DELETE folder (recursive)
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

    # soft-delete files via SQL
    db.execute(
        text("UPDATE files SET is_deleted = TRUE WHERE folder_id = :id"),
        {"id": folder.id},
    )

    for sub in subfolders:
        sub.is_deleted = True
        db.execute(
            text("UPDATE files SET is_deleted = TRUE WHERE folder_id = :id"),
            {"id": sub.id},
        )

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
    db.execute(
        text("UPDATE files SET is_deleted = FALSE WHERE folder_id = :id"),
        {"id": folder.id},
    )

    for sub in subfolders:
        sub.is_deleted = False
        db.execute(
            text("UPDATE files SET is_deleted = FALSE WHERE folder_id = :id"),
            {"id": sub.id},
        )

    db.commit()
    return {"message": "Folder restored"}


# -------------------------
# PERMANENT DELETE folder (FINAL, FK-SAFE)
# -------------------------
@router.delete("/{folder_id}/permanent")
def permanently_delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    root = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True,
    ).first()

    if not root:
        raise HTTPException(
            status_code=404, detail="Folder not found in trash")

    subfolders = get_subfolders(db, current_user.id, root.id)

    # deepest → root
    all_folders = subfolders[::-1] + [root]

    with db.no_autoflush:
        for folder in all_folders:
            # 1️⃣ Break parent FK
            db.execute(
                text("UPDATE folders SET parent_id = NULL WHERE parent_id = :id"),
                {"id": folder.id},
            )

            # 2️⃣ RAW delete files
            db.execute(
                text("DELETE FROM files WHERE folder_id = :id"),
                {"id": folder.id},
            )

            # 3️⃣ Delete shares
            permanently_delete_folder_shares(db, folder.id)

            # 4️⃣ RAW delete folder
            db.execute(
                text("DELETE FROM folders WHERE id = :id"),
                {"id": folder.id},
            )

    db.commit()
    return {"message": "Folder permanently deleted"}
