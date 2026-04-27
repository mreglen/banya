from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
import hashlib
from pathlib import Path
from app.database import get_db
from app.models import Bath, Photo, BathPromotion, Promotion
from app.schemas import BathOut, BathCreate, BathUpdate
from app.image_utils import process_image_to_webp

router = APIRouter(prefix="/baths", tags=["baths"])


@router.get("/")
def get_baths(db: Session = Depends(get_db)):

    baths = db.query(Bath)\
        .options(joinedload(Bath.photos))\
        .all()

    if not baths:
        return []

    return baths


@router.get("/{bath_id}")
def get_bath(bath_id: int, db: Session = Depends(get_db)):
    bath = db.query(Bath)\
        .options(joinedload(Bath.photos))\
        .filter(Bath.bath_id == bath_id)\
        .first()

    if not bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")
    
    # Load active promotions for this bath
    bath.promotions = db.query(Promotion).join(BathPromotion).filter(
        BathPromotion.bath_id == bath_id,
        Promotion.is_active == True
    ).all()

    return {
        "bath_id": bath.bath_id,
        "name": bath.name,
        "title": bath.title,
        "cost_weekday": bath.cost_weekday,
        "cost_weekend": bath.cost_weekend,
        "description": bath.description,
        "base_guests": bath.base_guests,
        "extra_guest_price": bath.extra_guest_price,
        "photos": [
            {
                "photo_id": p.photo_id,
                "image_url": p.image_url,
                "bath_id": p.bath_id
            }
            for p in bath.photos
        ],
        "promotions": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "min_hours": p.min_hours,
                "min_guests": p.min_guests,
                "min_amount": p.min_amount,
                "bonus_minutes": p.bonus_minutes,
                "valid_from": p.valid_from,
                "valid_until": p.valid_until
            }
            for p in bath.promotions
        ]
    }

# новые эндпоинты
@router.post("/", response_model=BathOut, status_code=201)
def create_bath(
    bath: BathCreate,
    db: Session = Depends(get_db)
):
    # Создаём баню
    db_bath = Bath(
        name=bath.name,
        title=bath.title,
        cost_weekday=bath.cost_weekday,
        cost_weekend=bath.cost_weekend,
        description=bath.description,
        base_guests=bath.base_guests,
        extra_guest_price=bath.extra_guest_price,
    )
    db.add(db_bath)
    db.commit()
    db.refresh(db_bath)

    # Добавляем фото
    for url in bath.photo_urls:
        db_photo = Photo(image_url=url, bath=db_bath)
        db.add(db_photo)
    
    # Добавляем связи с акциями
    for promo_id in bath.promotion_ids:
        promo = db.query(Promotion).filter(Promotion.id == promo_id).first()
        if promo:
            bath_promo = BathPromotion(bath_id=db_bath.bath_id, promotion_id=promo_id)
            db.add(bath_promo)

    db.commit()
    db.refresh(db_bath)
    return db_bath


@router.put("/{bath_id}", response_model=BathOut)
def update_bath(
    bath_id: int,
    bath_update: BathUpdate,
    db: Session = Depends(get_db)
):
    db_bath = db.query(Bath).filter(Bath.bath_id == bath_id).first()
    if not db_bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    # Обновляем основные поля
    update_data = bath_update.model_dump(exclude_unset=True)
    promotion_ids = update_data.pop('promotion_ids', None)
    
    for key, value in update_data.items():
        if key not in ["photo_urls"]:
            setattr(db_bath, key, value)

    # Обработка фото: если передано — заменяем все
    if bath_update.photo_urls is not None:
        # Удаляем старые
        db.query(Photo).filter(Photo.bath_id == bath_id).delete()
        # Добавляем новые
        for url in bath_update.photo_urls:
            db_photo = Photo(image_url=url, bath=db_bath)
            db.add(db_photo)
    
    # Обновляем связи с акциями
    if promotion_ids is not None:
        # Удаляем старые связи
        db.query(BathPromotion).filter(BathPromotion.bath_id == bath_id).delete()
        
        # Создаем новые связи
        for promo_id in promotion_ids:
            promo = db.query(Promotion).filter(Promotion.id == promo_id).first()
            if promo:
                bath_promo = BathPromotion(bath_id=bath_id, promotion_id=promo_id)
                db.add(bath_promo)

    db.commit()
    db.refresh(db_bath)
    return db_bath


@router.delete("/{bath_id}", status_code=204)
def delete_bath(bath_id: int, db: Session = Depends(get_db)):
    db_bath = db.query(Bath).filter(Bath.bath_id == bath_id).first()
    if not db_bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")
    
    db.delete(db_bath)
    db.commit()
    return None

@router.delete("/{bath_id}/photos/{photo_id}", status_code=200)
def delete_bath_photo(
    bath_id: int,
    photo_id: int,
    db: Session = Depends(get_db)
):
    # Find the photo
    db_photo = db.query(Photo).filter(
        Photo.photo_id == photo_id,
        Photo.bath_id == bath_id
    ).first()
    
    if not db_photo:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    
    # Delete the physical file if it exists
    try:
        filepath = Path(".") / db_photo.image_url.lstrip("/")
        if filepath.exists():
            filepath.unlink()
    except Exception as e:
        print(f"Warning: Could not delete file {db_photo.image_url}: {e}")
    
    # Delete from database
    db.delete(db_photo)
    db.commit()
    
    return {"message": "Фото успешно удалено"}

# добавить фото
UPLOAD_DIR = Path("uploads/photos/baths/")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

@router.post("/{bath_id}/upload", response_model=List[str])
async def upload_bath_photos(
    bath_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    db_bath = db.query(Bath).filter(Bath.bath_id == bath_id).first()
    if not db_bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    # Удаляем старые фото перед загрузкой новых
    db.query(Photo).filter(Photo.bath_id == bath_id).delete()

    urls = []
    for file in files:
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Файл {file.filename} слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024*1024)} МБ"
            )
        
        # Process: compress, convert to WebP, strip metadata
        webp_bytes = process_image_to_webp(content)
        
        # Generate hash-based filename
        file_hash = hashlib.sha256(webp_bytes).hexdigest()[:16]
        unique_filename = f"{file_hash}.webp"
        filepath = UPLOAD_DIR / unique_filename
        
        # Save processed WebP file
        with open(filepath, "wb") as f:
            f.write(webp_bytes)
        
        # Save URL to database (relative to uploads directory)
        db_photo = Photo(image_url=f"/uploads/photos/baths/{unique_filename}", bath=db_bath)
        db.add(db_photo)
        urls.append(f"/uploads/photos/baths/{unique_filename}")

    db.commit()
    return urls