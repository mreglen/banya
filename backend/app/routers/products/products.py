from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
from pathlib import Path
import hashlib
from app.database import get_db
from app.database import SessionLocal
from app.models import Product as ProductModel, Category, Photo, UnitOfMeasurement, User
from app.schemas import Product, ProductCreate, UnitOfMeasurementResponse, StockProduct, UnitOfMeasurementBase
from app.auth import get_current_user
from app.audit_logger import log_detailed_action, get_client_ip
from app.image_utils import process_image_to_webp

router = APIRouter(prefix="/admin/products", tags=["products"])


UPLOAD_DIR = Path("uploads/photos/products/")
VIDEO_UPLOAD_DIR = Path("uploads/videos/products/")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".ogg", ".mkv", ".m4v"}


def _is_video_upload(file: UploadFile) -> bool:
    content_type = (file.content_type or "").lower()
    if content_type.startswith("video/"):
        return True
    ext = Path(file.filename or "").suffix.lower()
    return ext in VIDEO_EXTENSIONS


def create_product_with_photos(db: Session, product_data: ProductCreate, photo_urls: List[str] = None):
    if product_data.category_id is not None:
        category = db.query(Category).filter(Category.id == product_data.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category does not exist")

    if product_data.unit_id is not None:
        unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == product_data.unit_id).first()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit of measurement does not exist")

    db_product = ProductModel(
        name=product_data.name,
        description=product_data.description,
        is_visible_on_website=product_data.is_visible_on_website,
        is_countable=product_data.is_countable,
        category_id=product_data.category_id,
        unit_id=product_data.unit_id,
        price=float(product_data.price or 0),
        is_price_manual=False,
        min_stock=0.0 if not product_data.is_countable else product_data.min_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    if photo_urls:
        for url in photo_urls:
            db_photo = Photo(image_url=url, product_id=db_product.id)
            db.add(db_photo)
        db.commit()
        db.refresh(db_product)

    return db_product

# --- ЭНДПОИНТЫ ---

@router.post("/", response_model=Product)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    return create_product_with_photos(db, product)


@router.get("/", response_model=list[Product])
def read_products(db: Session = Depends(get_db)):
    return db.query(ProductModel)\
             .options(
                 joinedload(ProductModel.photos),
                 joinedload(ProductModel.unit)
             ).all()

@router.get("/{product_id}", response_model=Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel)\
        .options(joinedload(ProductModel.photos))\
        .filter(ProductModel.id == product_id)\
        .first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    product: ProductCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.unit_id is not None:
        unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == product.unit_id).first()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit of measurement does not exist")

    old_price = float(db_product.price or 0)

    for key, value in product.model_dump().items():
        setattr(db_product, key, value)

    if not db_product.is_countable:
        db_product.min_stock = 0.0

    new_price = float(db_product.price or 0)
    if abs(new_price - old_price) > 1e-6:
        db_product.is_price_manual = True
        summary = (
            f"Изменена цена товара '{db_product.name}' "
            f"с {old_price:.2f} ₽ на {new_price:.2f} ₽"
        )
        background_tasks.add_task(
            log_detailed_action,
            db=SessionLocal(),
            user_id=current_user.user_id,
            action="UPDATE",
            entity_type="product",
            entity_id=product_id,
            details={"old_price": old_price, "new_price": new_price, "name": db_product.name},
            summary=summary,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent")
        )

    db.commit()
    db.refresh(db_product)
    return db_product


@router.post("/{product_id}/upload", response_model=list[str])
async def upload_product_photos(
    product_id: int,
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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
            image_url = f"/uploads/videos/products/{unique_filename}"
        else:
            try:
                webp_bytes = process_image_to_webp(content)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Не удалось обработать изображение: {file.filename}")

            file_hash = hashlib.sha256(webp_bytes).hexdigest()[:16]
            safe_filename = f"{file_hash}.webp"
            filepath = UPLOAD_DIR / safe_filename

            with open(filepath, "wb") as f:
                f.write(webp_bytes)

            image_url = f"/uploads/photos/products/{safe_filename}"

        db_photo = Photo(
            image_url=image_url,
            product_id=product_id
        )
        db.add(db_photo)
        urls.append(image_url)

    db.commit()
    return urls


@router.delete("/{product_id}/photos/{photo_id}", status_code=200)
def delete_product_photo(
    product_id: int,
    photo_id: int,
    db: Session = Depends(get_db)
):
    db_photo = db.query(Photo).filter(
        Photo.photo_id == photo_id,
        Photo.product_id == product_id
    ).first()

    if not db_photo:
        raise HTTPException(status_code=404, detail="Фото не найдено")

    try:
        filepath = Path(".") / db_photo.image_url.lstrip("/")
        if filepath.exists():
            filepath.unlink()
    except Exception as e:
        print(f"Warning: Could not delete file {db_photo.image_url}: {e}")

    db.delete(db_photo)
    db.commit()

    return {"message": "Фото успешно удалено"}

@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Удаляем связанные фото (если нужно удалить и файлы с диска — добавьте логику)
    db.query(Photo).filter(Photo.product_id == product_id).delete()

    db.delete(product)
    db.commit()
    return

@router.get("/units/", response_model=List[UnitOfMeasurementResponse])
def get_units_of_measurement(db: Session = Depends(get_db)):
    return db.query(UnitOfMeasurement).all()

@router.post("/units/", response_model=UnitOfMeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_unit_of_measurement(
    unit: UnitOfMeasurementBase,
    db: Session = Depends(get_db)
):
    """Create a new unit of measurement"""
    # Check if unit with same name already exists
    existing = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.name == unit.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Единица измерения с таким названием уже существует")

    db_unit = UnitOfMeasurement(
        name=unit.name,
        description=unit.description
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.put("/units/{unit_id}", response_model=UnitOfMeasurementResponse)
def update_unit_of_measurement(
    unit_id: int,
    unit: UnitOfMeasurementBase,
    db: Session = Depends(get_db)
):
    """Update an existing unit of measurement"""
    db_unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Единица измерения не найдена")

    # Check if new name conflicts with existing unit
    existing = db.query(UnitOfMeasurement).filter(
        UnitOfMeasurement.name == unit.name,
        UnitOfMeasurement.id != unit_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Единица измерения с таким названием уже существует")

    db_unit.name = unit.name
    db_unit.description = unit.description
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit_of_measurement(
    unit_id: int,
    db: Session = Depends(get_db)
):
    """Delete a unit of measurement"""
    db_unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Единица измерения не найдена")

    # Check if any products are using this unit
    products_using_unit = db.query(ProductModel).filter(ProductModel.unit_id == unit_id).count()
    if products_using_unit > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Невозможно удалить: эту единицу измерения используют {products_using_unit} товаров"
        )

    db.delete(db_unit)
    db.commit()
    return

@router.get("/stock/products", response_model=list[StockProduct])
def get_stock_products(db: Session = Depends(get_db)):
    return db.query(ProductModel)\
             .options(
                 joinedload(ProductModel.category),      # ← добавлено
                 joinedload(ProductModel.unit)           # ← добавлено
             ).all()
