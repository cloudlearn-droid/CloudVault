from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.folder import Folder
from app.models.user import User

router = APIRouter(prefix="/trash", tags=["Trash"])


@router.get("")
def list_trash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List deleted folders for the logged-in user.
    """

    folders = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True
    ).all()

    return folders


@router.post("/restore/{folder_id}")
def restore_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id,
        Folder.is_deleted == True
    ).first()

    if not folder:
        raise HTTPException(
            status_code=404, detail="Folder not found in trash")

    folder.is_deleted = False
    db.commit()

    return {"message": "Folder restored"}
