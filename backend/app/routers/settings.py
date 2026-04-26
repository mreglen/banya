from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, database
from app.auth import get_current_user

router = APIRouter(
    prefix="/admin/settings",
    tags=["settings"]
)


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
        {"key": "cleaning_time_minutes", "value": 30, "description": "Время для уборки между бронированиями (в минутах)"},
        {"key": "booking_interval_minutes", "value": 30, "description": "Размер промежутка для бронирования (в минутах)"}
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
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director)
):
    """Update settings"""
    seed_default_settings(db)
    
    updates = settings_update.model_dump(exclude_unset=True)
    
    if "cleaning_time_minutes" in updates:
        if updates["cleaning_time_minutes"] < 0:
            raise HTTPException(
                status_code=400,
                detail="Время для уборки должно быть положительным числом"
            )
        setting = db.query(models.Settings).filter(models.Settings.key == "cleaning_time_minutes").first()
        if setting:
            setting.value = updates["cleaning_time_minutes"]
        else:
            setting = models.Settings(
                key="cleaning_time_minutes",
                value=updates["cleaning_time_minutes"],
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
        if setting:
            setting.value = updates["booking_interval_minutes"]
        else:
            setting = models.Settings(
                key="booking_interval_minutes",
                value=updates["booking_interval_minutes"],
                description="Размер промежутка для бронирования (в минутах)"
            )
            db.add(setting)
    
    db.commit()
    
    return {"message": "Настройки успешно обновлены"}
