from fastapi import FastAPI

from app.core.database import engine, Base

from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.models.share import Share
from app.models.link_share import LinkShare
from app.routes import trash
from app.routes import shared
from app.routes import public


from app.routes import auth, folders, shares, search

app = FastAPI(title="CloudVault Backend")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(folders.router)
app.include_router(shares.router)
app.include_router(search.router)
app.include_router(trash.router)
app.include_router(shared.router)
app.include_router(public.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CloudVault backend is running"}
