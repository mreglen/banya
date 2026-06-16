from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
from app import models, schemas, database
from app.auth import get_current_user
from app.database import SessionLocal
from app.audit_logger import log_detailed_action, get_client_ip
from app.pricing import get_markup_percent, price_from_purchase
from app.image_utils import process_image_to_webp

router = APIRouter(
    prefix="/admin/settings",
    tags=["settings"]
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PAYMENT_QR_UPLOAD_DIR = BASE_DIR / "uploads" / "payment"
PAYMENT_QR_FILENAME = "payment_qrcode.webp"


def check_admin_or_director(current_user: models.User = Depends(get_current_user)):
    """Check if user is admin or director"""
    if not (current_user.is_admin or current_user.is_director):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ разрешен только администратору или директору"
        )
    return current_user


def seed_default_settings(db: Session):
    """Create default settings if they don't exist"""
    defaults = [
        {"key": "cleaning_time_minutes", "value": 30.0, "description": "Время для уборки между бронированиями (в минутах)"},
        {"key": "booking_interval_minutes", "value": 30.0, "description": "Размер промежутка для бронирования (в минутах)"},
        {"key": "markup_percent", "value": 0.0, "description": "Наценка на товары (%)"},
    ]

    for default in defaults:
        existing = db.query(models.Settings).filter(models.Settings.key == default["key"]).first()
        if not existing:
            setting = models.Settings(**default)
            db.add(setting)

    db.commit()


@router.get("/", response_model=list[schemas.SettingsResponse])
def get_settings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director)
):
    """Get all settings"""
    seed_default_settings(db)
    settings = db.query(models.Settings).all()
    return settings


@router.put("/", response_model=dict)
def update_settings(
    settings_update: schemas.SettingsUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director)
):
    """Update settings"""
    seed_default_settings(db)

    updates = settings_update.model_dump(exclude_unset=True)
    update_manual_prices = bool(updates.pop("update_manual_prices", False))

    if "cleaning_time_minutes" in updates:
        if updates["cleaning_time_minutes"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Время для уборки должно быть положительным числом"
            )
        setting = db.query(models.Settings).filter(models.Settings.key == "cleaning_time_minutes").first()
        v = float(updates["cleaning_time_minutes"])
        if setting:
            setting.value = v
        else:
            setting = models.Settings(
                key="cleaning_time_minutes",
                value=v,
                description="Время для уборки между бронированиями (в минутах)"
            )
            db.add(setting)

    if "booking_interval_minutes" in updates:
        if updates["booking_interval_minutes"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Размер промежутка должен быть положительным числом"
            )
        setting = db.query(models.Settings).filter(models.Settings.key == "booking_interval_minutes").first()
        v = float(updates["booking_interval_minutes"])
        if setting:
            setting.value = v
        else:
            setting = models.Settings(
                key="booking_interval_minutes",
                value=v,
                description="Размер промежутка для бронирования (в минутах)"
            )
            db.add(setting)

    if "markup_percent" in updates:
        new_markup = float(updates["markup_percent"])
        if new_markup < 0:
            raise HTTPException(
                status_code=400,
                detail="Наценка не может быть отрицательной"
            )
        setting = db.query(models.Settings).filter(models.Settings.key == "markup_percent").first()
        old_markup = float(setting.value) if setting else 0.0
        if setting:
            setting.value = new_markup
        else:
            setting = models.Settings(
                key="markup_percent",
                value=new_markup,
                description="Наценка на товары (%)"
            )
            db.add(setting)

        products = db.query(models.Product).all()
        recalc_count = 0
        for p in products:
            if update_manual_prices or not p.is_price_manual:
                p.price = price_from_purchase(p.last_purchase_price, new_markup)
                if update_manual_prices:
                    p.is_price_manual = False
                recalc_count += 1

        summary = (
            f"Изменена наценка с {old_markup}% на {new_markup}%, "
            f"пересчитано цен у {recalc_count} товаров"
        )
        background_tasks.add_task(
            log_detailed_action,
            db=SessionLocal(),
            user_id=current_user.user_id,
            action="UPDATE",
            entity_type="settings",
            entity_id=None,
            details={"key": "markup_percent", "old": old_markup, "new": new_markup, "recalc_count": recalc_count},
            summary=summary,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent")
        )

    db.commit()

    return {"message": "Настройки успешно обновлены"}


def _get_or_create_payment_qr_row(db: Session) -> models.PaymentQrSetting:
    row = db.query(models.PaymentQrSetting).filter(models.PaymentQrSetting.id == 1).first()
    if not row:
        row = models.PaymentQrSetting(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/payment-qrcode", response_model=schemas.PaymentQrCodeResponse)
def get_payment_qrcode(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Получить URL QR-кода для оплаты (доступно всем авторизованным пользователям)."""
    row = _get_or_create_payment_qr_row(db)
    return schemas.PaymentQrCodeResponse(image_url=row.image_url)


@router.post("/payment-qrcode", response_model=schemas.PaymentQrCodeResponse)
async def upload_payment_qrcode(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    """Загрузить QR-код для оплаты (только администратор или директор)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Пустой файл")

    try:
        webp_bytes = process_image_to_webp(content, max_width=1024, quality=90)
    except Exception:
        raise HTTPException(status_code=400, detail="Не удалось обработать изображение")

    PAYMENT_QR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filepath = PAYMENT_QR_UPLOAD_DIR / PAYMENT_QR_FILENAME
    with open(filepath, "wb") as f:
        f.write(webp_bytes)

    image_url = f"/uploads/payment/{PAYMENT_QR_FILENAME}"
    row = _get_or_create_payment_qr_row(db)
    row.image_url = image_url
    row.uploaded_by_user_id = current_user.user_id
    db.commit()
    db.refresh(row)

    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="payment_qr_setting",
        entity_id=1,
        details={"image_url": image_url},
        summary="Загружен QR-код для оплаты",
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    return schemas.PaymentQrCodeResponse(image_url=row.image_url)
