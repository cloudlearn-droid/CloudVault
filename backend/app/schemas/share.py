from pydantic import BaseModel


class ShareCreate(BaseModel):
    folder_id: int
    user_id: int
    role: str  # editor / viewer
