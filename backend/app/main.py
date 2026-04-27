from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles  
from app.database import Base, engine
from app.routers import api_router
from app.routers import promotions
from app.routers import audit_logs
from app.websocket import websocket_endpoint
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


# Middleware to increase request body size limit (50 MB)
class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request._receive = self._receive_with_limit(request, call_next)
        response = await call_next(request)
        return response
    
    def _receive_with_limit(self, request, call_next):
        original_receive = request.receive
        max_body_size = 50 * 1024 * 1024  # 50 MB
        
        async def receive_with_limit():
            message = await original_receive()
            if message["type"] == "http.request":
                body = message.get("body", b"")
                if len(body) > max_body_size:
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=413,
                        detail=f"Request body too large. Maximum size is {max_body_size // (1024*1024)} MB"
                    )
            return message
        
        return receive_with_limit


Base.metadata.create_all(bind=engine)

app = FastAPI(title='Бани')

# Add middleware to increase body size limit
app.add_middleware(MaxBodySizeMiddleware)

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
# Use absolute path based on this file's location
BASE_DIR = Path(__file__).resolve().parent.parent

# Mount public images
public_img_dir = BASE_DIR / "public" / "img"
if public_img_dir.exists():
    app.mount("/img", StaticFiles(directory=str(public_img_dir)), name="static_images")

# Mount uploads directory for bath photos
uploads_dir = BASE_DIR / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(api_router)
app.include_router(promotions.router, prefix="/api", tags=["promotions"])
app.include_router(audit_logs.router)

# WebSocket endpoint для чата поддержки
@app.websocket("/ws/support/{ticket_id}")
async def websocket_support_endpoint(websocket: WebSocket, ticket_id: int, token: str = None):
    await websocket_endpoint(websocket, ticket_id, token=token)