from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  
from app.database import Base, engine
from app.routers import api_router
from app.routers import promotions
from app.routers import audit_logs
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path


Base.metadata.create_all(bind=engine)

app = FastAPI(title='Бани')

# CORS configuration - restrict to specific origins for security
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directories
app.mount("/img", StaticFiles(directory="public/img"), name="static_images")

# Mount uploads directory for bath photos
uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router)
app.include_router(promotions.router, prefix="/api", tags=["promotions"])
app.include_router(audit_logs.router)