from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base

# Models
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.models.share import Share
from app.models.link_share import LinkShare

# Routes
from app.routes import auth, folders, files, shares, search, trash, shared, public

app = FastAPI(title="CloudVault Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router)
app.include_router(folders.router)
app.include_router(files.router)
app.include_router(shares.router)
app.include_router(search.router)
app.include_router(trash.router)
app.include_router(shared.router)
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok"}
