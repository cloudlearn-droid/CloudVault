from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_user
from app.models.link_share import LinkShare
from app.models.folder import Folder
from app.models.user import User

router = APIRouter(prefix="/public", tags=["Public"])


@router.post("/create/{folder_id}")
def create_public_link(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    token = str(uuid.uuid4())

    link = LinkShare(
        folder_id=folder_id,
        token=token
    )

    db.add(link)
    db.commit()

    return {
        "public_url": f"http://127.0.0.1:8000/public/{token}"
    }


@router.get("/{token}")
def access_public_folder(
    token: str,
    db: Session = Depends(get_db)
):
    link = db.query(LinkShare).filter(
        LinkShare.token == token
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")

    folder = db.query(Folder).filter(
        Folder.id == link.folder_id,
        Folder.is_deleted == False
    ).first()

    return folder
