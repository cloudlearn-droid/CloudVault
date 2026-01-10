from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.share import Share
from app.models.folder import Folder
from app.models.user import User
from app.schemas.share import ShareCreate

router = APIRouter(prefix="/shares", tags=["Sharing"])


@router.post("")
def share_folder(
    data: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == data.folder_id,
        Folder.owner_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=403, detail="Not allowed")

    share = Share(
        folder_id=data.folder_id,
        shared_with_user_id=data.user_id,
        role=data.role
    )

    db.add(share)
    db.commit()
    return {"message": "Folder shared successfully"}
