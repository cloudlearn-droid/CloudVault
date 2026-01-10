from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class Share(Base):
    __tablename__ = "shares"

    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)

    shared_with_user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)  # owner / editor / viewer
