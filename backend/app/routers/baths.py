from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import os
import uuid
import hashlib
from pathlib import Path
from app.database import get_db
from app.models import Bath, Photo, BathPromotion, Promotion, PromotionGiftProduct
from app.schemas import BathOut, BathCreate, BathUpdate
from app.image_utils import process_image_to_webp
from app.slug_utils import generate_slug, make_unique_slug
from app.promotion_utils import serialize_promotion_brief

router = APIRouter(prefix="/baths", tags=["baths"])


def _serialize_bath(bath: Bath) -> dict:
    active_promos = [p for p in (bath.promotions or []) if p.is_active]
    return {
        "bath_id": bath.bath_id,
        "slug": bath.slug,
        "name": bath.name,
        "title": bath.title,
        "cost_weekday": bath.cost_weekday,
        "cost_weekend": bath.cost_weekend,
        "min_booking_hours": bath.min_booking_hours,
        "description": bath.description,
        "base_guests": bath.base_guests,
        "extra_guest_price": bath.extra_guest_price,
        "photos": [
            {
                "photo_id": p.photo_id,
                "image_url": p.image_url,
                "bath_id": p.bath_id,
            }
            for p in bath.photos
        ],
        "promotions": [serialize_promotion_brief(p) for p in active_promos],
    }


@router.get("/")
def get_baths(db: Session = Depends(get_db)):

    baths = db.query(Bath)\
        .options(
            joinedload(Bath.photos),
            joinedload(Bath.promotions)
            .joinedload(Promotion.gift_products)
            .joinedload(PromotionGiftProduct.product),
        )\
        .all()

    if not baths:
        return []

    return [_serialize_bath(bath) for bath in baths]


@router.get("/{slug_or_id}")
def get_bath(slug_or_id: str, db: Session = Depends(get_db)):
    bath = db.query(Bath)\
        .options(
            joinedload(Bath.photos),
            joinedload(Bath.promotions)
            .joinedload(Promotion.gift_products)
            .joinedload(PromotionGiftProduct.product),
        )\
        .filter(Bath.slug == slug_or_id)\
        .first()

    # Поддержка /baths/1 для админки (по bath_id)
    if not bath and slug_or_id.isdigit():
        bath = db.query(Bath)\
            .options(
                joinedload(Bath.photos),
                joinedload(Bath.promotions)
                .joinedload(Promotion.gift_products)
                .joinedload(PromotionGiftProduct.product),
            )\
            .filter(Bath.bath_id == int(slug_or_id))\
            .first()

    if not bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    return _serialize_bath(bath)

# новые эндпоинты
@router.post("/", response_model=BathOut, status_code=201)
def create_bath(
    bath: BathCreate,
    db: Session = Depends(get_db)
):
    # Генерируем slug из названия
    base_slug = generate_slug(bath.name)
    
    # Проверяем уникальность slug
    existing_slugs = [row[0] for row in db.query(Bath.slug).all()]
    slug = make_unique_slug(base_slug, existing_slugs)
    
    # Создаём баню
    db_bath = Bath(
        slug=slug,
        name=bath.name,
        title=bath.title,
        cost_weekday=bath.cost_weekday,
        cost_weekend=bath.cost_weekend,
        min_booking_hours=bath.min_booking_hours,
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
    
    # Если обновляется name, перегенерируем slug
    if 'name' in update_data and update_data['name'] != db_bath.name:
        base_slug = generate_slug(update_data['name'])
        existing_slugs = [row[0] for row in db.query(Bath.slug).filter(Bath.bath_id != bath_id).all()]
        update_data['slug'] = make_unique_slug(base_slug, existing_slugs)
    
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

    try:
        db.delete(db_bath)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить баню: есть связанные бронирования или заявки",
        )
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

# добавить фото и видео
UPLOAD_DIR = Path("uploads/photos/baths/")
VIDEO_UPLOAD_DIR = Path("uploads/videos/baths/")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".ogg", ".mkv", ".m4v"}


def _is_video_upload(file: UploadFile) -> bool:
    content_type = (file.content_type or "").lower()
    if content_type.startswith("video/"):
        return True
    ext = Path(file.filename or "").suffix.lower()
    return ext in VIDEO_EXTENSIONS


@router.post("/{bath_id}/upload", response_model=List[str])
async def upload_bath_photos(
    bath_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    db_bath = db.query(Bath).filter(Bath.bath_id == bath_id).first()
    if not db_bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    urls = []
    for file in files:
        content = await file.read()

        if _is_video_upload(file):
            ext = Path(file.filename or "").suffix.lower()
            if ext not in VIDEO_EXTENSIONS:
                ext = ".mp4"
            file_hash = hashlib.sha256(content).hexdigest()[:16]
            unique_filename = f"{file_hash}{ext}"
            filepath = VIDEO_UPLOAD_DIR / unique_filename
            with open(filepath, "wb") as f:
                f.write(content)
            image_url = f"/uploads/videos/baths/{unique_filename}"
        else:
            try:
                webp_bytes = process_image_to_webp(content)
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail=f"Не удалось обработать изображение: {file.filename}",
                )
            file_hash = hashlib.sha256(webp_bytes).hexdigest()[:16]
            unique_filename = f"{file_hash}.webp"
            filepath = UPLOAD_DIR / unique_filename
            with open(filepath, "wb") as f:
                f.write(webp_bytes)
            image_url = f"/uploads/photos/baths/{unique_filename}"

        db_photo = Photo(image_url=image_url, bath=db_bath)
        db.add(db_photo)
        urls.append(image_url)

    db.commit()
    return urls