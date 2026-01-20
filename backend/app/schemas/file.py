from pydantic import BaseModel
from typing import Optional


class FileOut(BaseModel):
    id: int
    name: str
    folder_id: Optional[int]

    class Config:
        from_attributes = True


class FileRename(BaseModel):
    name: str


class FileMove(BaseModel):
    folder_id: Optional[int] = None
