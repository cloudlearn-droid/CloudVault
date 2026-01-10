from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.deps import get_db, get_current_user
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def search(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search folders and files by name (owned only).
    """

    folders = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False,
        Folder.name.ilike(f"%{q}%")
    ).all()

    files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.is_deleted == False,
        File.name.ilike(f"%{q}%")
    ).all()

    return {
        "folders": folders,
        "files": files
    }
