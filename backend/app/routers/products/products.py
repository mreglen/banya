from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
from pathlib import Path
from app.database import get_db
from app.models import Product as ProductModel, Category, Photo, UnitOfMeasurement
from app.schemas import Product, ProductCreate, UnitOfMeasurementResponse, StockProduct, UnitOfMeasurementBase

router = APIRouter(prefix="/admin/products", tags=["products"])


UPLOAD_DIR = Path("public/img/products/")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def create_product_with_photos(db: Session, product_data: ProductCreate, photo_urls: List[str] = None):
    if product_data.category_id is not None:
        category = db.query(Category).filter(Category.id == product_data.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category does not exist")

    db_product = ProductModel(
        name=product_data.name,
        description=product_data.description,
        is_visible_on_website=product_data.is_visible_on_website,
        category_id=product_data.category_id  
    )
    
    if product_data.unit_id is not None:
        unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == product_data.unit_id).first()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit of measurement does not exist")

    db_product = ProductModel(
        name=product_data.name,
        description=product_data.description,
        is_visible_on_website=product_data.is_visible_on_website,
        category_id=product_data.category_id,
        unit_id=product_data.unit_id  
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
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.unit_id is not None:
        unit = db.query(UnitOfMeasurement).filter(UnitOfMeasurement.id == product.unit_id).first()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit of measurement does not exist")
    
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.post("/{product_id}/upload", response_model=list[str])
async def upload_product_photos(
    product_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.query(Photo).filter(Photo.product_id == product_id).delete()

    urls = []
    for file in files:
        # Генерируем безопасное имя файла
        extension = file.filename.split('.')[-1].lower()
        safe_filename = f"{product_id}_{file.filename.replace(' ', '_').replace('.', '_')}.{extension}"
        filepath = UPLOAD_DIR / safe_filename

        # Сохраняем файл
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        # Сохраняем URL в БД
        db_photo = Photo(
            image_url=f"/img/products/{safe_filename}",
            product_id=product_id
        )
        db.add(db_photo)
        urls.append(f"/img/products/{safe_filename}")

    db.commit()
    return urls

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