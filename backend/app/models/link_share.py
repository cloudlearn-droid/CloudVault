from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class LinkShare(Base):
    __tablename__ = "link_shares"

    id = Column(Integer, primary_key=True)
    folder_id = Column(Integer, ForeignKey("folders.id"))
    token = Column(String, unique=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
