from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles  
from app.database import Base, engine
from app import models  # noqa: F401 - важно для регистрации моделей в metadata
from app.routers import api_router
from app.routers import promotions
from app.routers import audit_logs
from app.websocket import websocket_endpoint
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from sqlalchemy import text
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

# Backward-compatible schema patch for existing databases.
with engine.begin() as connection:
    # Baths: ensure slug exists for website routes
    connection.execute(
        text(
            """
            ALTER TABLE baths
            ADD COLUMN IF NOT EXISTS slug VARCHAR(200)
            """
        )
    )
    # Backfill slug for existing rows (keep it deterministic & unique)
    connection.execute(
        text(
            """
            UPDATE baths
            SET slug = COALESCE(NULLIF(slug, ''), bath_id::text)
            WHERE slug IS NULL OR slug = ''
            """
        )
    )
    # Ensure NOT NULL + unique index (idempotent)
    connection.execute(text("ALTER TABLE baths ALTER COLUMN slug SET NOT NULL"))
    connection.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ix_baths_slug ON baths (slug)
            """
        )
    )

    connection.execute(
        text(
            """
            ALTER TABLE categories
            ADD COLUMN IF NOT EXISTS is_visible_on_website BOOLEAN NOT NULL DEFAULT FALSE
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS is_countable BOOLEAN NOT NULL DEFAULT TRUE
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS is_price_manual BOOLEAN NOT NULL DEFAULT FALSE
            """
        )
    )
    connection.execute(
        text(
            """
            DO $mig$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'website_price'
              ) THEN
                EXECUTE $q$
                  UPDATE products SET price = website_price
                  WHERE price = 0 AND website_price IS NOT NULL AND website_price > 0
                $q$;
              END IF;
            END
            $mig$;
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE products DROP COLUMN IF EXISTS website_price
            """
        )
    )
    connection.execute(
        text(
            """
            DO $mig$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'settings'
                  AND column_name = 'value' AND udt_name = 'int4'
              ) THEN
                ALTER TABLE settings ALTER COLUMN value TYPE DOUBLE PRECISION USING value::DOUBLE PRECISION;
              END IF;
            END
            $mig$;
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO settings (key, value, description)
            SELECT 'markup_percent', 0, 'Наценка на товары (%)'
            WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'markup_percent')
            """
        )
    )
    connection.execute(
        text(
            """
            UPDATE products p SET price = ROUND(
                (p.last_purchase_price * (
                    1 + COALESCE(
                        (SELECT s.value FROM settings s WHERE s.key = 'markup_percent' LIMIT 1),
                        0
                    ) / 100.0
                ))::numeric, 2
            )
            WHERE p.price = 0 AND p.last_purchase_price IS NOT NULL AND p.last_purchase_price > 0
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE realization_documents
            ADD COLUMN IF NOT EXISTS bath_id INTEGER
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE entrance_documents
            ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES organization_accounts(id) ON DELETE SET NULL
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE realization_documents
            ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES organization_accounts(id) ON DELETE SET NULL
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE reservations
            ADD COLUMN IF NOT EXISTS income_account_id INTEGER REFERENCES organization_accounts(id) ON DELETE SET NULL
            """
        )
    )
    connection.execute(
        text(
            """
            UPDATE realization_documents rd
            SET bath_id = r.bath_id
            FROM reservations r
            WHERE rd.reservation_id = r.reservation_id
              AND rd.bath_id IS NULL
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE users
            ALTER COLUMN email DROP NOT NULL
            """
        )
    )
    connection.execute(
        text(
            """
            ALTER TABLE reservations
            ADD COLUMN IF NOT EXISTS prepayment INTEGER NOT NULL DEFAULT 0
            """
        )
    )
    connection.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS payment_qr_setting (
                id INTEGER PRIMARY KEY DEFAULT 1,
                image_url VARCHAR(500),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                uploaded_by_user_id INTEGER REFERENCES users(user_id)
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO payment_qr_setting (id)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM payment_qr_setting WHERE id = 1)
            """
        )
    )

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