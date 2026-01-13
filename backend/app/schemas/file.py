from pydantic import BaseModel
from typing import Optional


class FileOut(BaseModel):
    id: int
    name: str
    folder_id: Optional[int]

    class Config:
        from_attributes = True
