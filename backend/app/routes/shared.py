from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.share import Share
from app.models.folder import Folder
from app.models.user import User

router = APIRouter(prefix="/shared", tags=["Shared"])


@router.get("")
def list_shared_with_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shares = db.query(Share).filter(
        Share.shared_with_user_id == current_user.id
    ).all()

    folder_ids = [s.folder_id for s in shares if s.folder_id]

    folders = db.query(Folder).filter(
        Folder.id.in_(folder_ids),
        Folder.is_deleted == False
    ).all()

    return folders
