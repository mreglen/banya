from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pathlib import Path
import hashlib
from app.database import get_db
from app.models import Category, Photo, Product
from app.schemas import Category as CategorySchema, CategoryCreate, CategoryUpdate, WebsiteCategoryPreview, WebsiteCategoryProduct
from app.image_utils import process_image_to_webp

router = APIRouter(prefix="/admin/categories", tags=["categories"])

UPLOAD_DIR = Path("uploads/photos/categories/")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


@router.get("/", response_model=List[CategorySchema])
def read_categories(db: Session = Depends(get_db)):
    categories = db.query(Category)\
        .options(joinedload(Category.photos))\
        .filter(Category.parent_id.is_(None))\
        .all()
    return categories


@router.get("/{category_id}", response_model=CategorySchema)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category)\
        .options(joinedload(Category.photos))\
        .filter(Category.id == category_id)\
        .first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategorySchema, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(
        name=category.name,
        parent_id=category.parent_id,
        is_visible_on_website=category.is_visible_on_website
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    # Добавляем фото из photo_urls
    if category.photo_urls:
        for url in category.photo_urls:
            db_photo = Photo(image_url=url, category=db_category)
            db.add(db_photo)
        db.commit()
        db.refresh(db_category)

    return db_category


@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    was_visible_on_website = bool(db_category.is_visible_on_website)

    # Debug logging
    print(f"Updating category {category_id}")
    print(f"Received data: {category_update.model_dump()}")
    print(f"Exclude unset: {category_update.model_dump(exclude_unset=True)}")

    # Обновляем основные поля
    update_data = category_update.model_dump(exclude_unset=True)
    
    # Explicitly handle is_visible_on_website to allow False values
    if "is_visible_on_website" in update_data:
        print(f"Setting is_visible_on_website to: {update_data['is_visible_on_website']}")
        db_category.is_visible_on_website = update_data["is_visible_on_website"]
        new_visible = bool(update_data["is_visible_on_website"])
        if new_visible and not was_visible_on_website:
            db.query(Product).filter(Product.category_id == category_id).update(
                {"is_visible_on_website": True},
                synchronize_session=False,
            )
    
    # Handle name
    if "name" in update_data:
        db_category.name = update_data["name"]
    
    # Handle parent_id with cycle protection
    if "parent_id" in update_data:
        value = update_data["parent_id"]
        if value == category_id:
            raise HTTPException(status_code=400, detail="Cannot set self as parent")
        db_category.parent_id = value

    # Обработка фото: если photo_urls передан — заменяем все
    if category_update.photo_urls is not None:
        db.query(Photo).filter(Photo.category_id == category_id).delete()
        for url in category_update.photo_urls:
            db_photo = Photo(image_url=url, category=db_category)
            db.add(db_photo)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.children:
        raise HTTPException(status_code=400, detail="Cannot delete category with subcategories")
    if category.products:
        raise HTTPException(status_code=400, detail="Cannot delete category with products")
    db.delete(category)
    db.commit()
    return {"ok": True}


@router.post("/{category_id}/upload", response_model=List[str])
async def upload_category_photos(
    category_id: int,
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    # Проверка существования категории
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    if files and len(files) > 1:
        raise HTTPException(status_code=400, detail="Для категории можно загрузить только 1 фотографию")

    # Удаляем все существующие фото
    db.query(Photo).filter(Photo.category_id == category_id).delete()

    urls = []
    if files:  # только если файлы переданы
        for file in files:
            content = await file.read()

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"Файл {file.filename} слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024 * 1024)} МБ",
                )

            try:
                webp_bytes = process_image_to_webp(content)
            except Exception:
                raise HTTPException(status_code=400, detail="Не удалось обработать изображение")

            file_hash = hashlib.sha256(webp_bytes).hexdigest()[:16]
            unique_filename = f"{file_hash}.webp"
            filepath = UPLOAD_DIR / unique_filename
            with open(filepath, "wb") as f:
                f.write(webp_bytes)

            url = f"/uploads/photos/categories/{unique_filename}"
            db_photo = Photo(image_url=url, category=db_category)
            db.add(db_photo)
            urls.append(url)

    db.commit()
    return urls


@router.get("/website/preview", response_model=List[WebsiteCategoryPreview])
def get_website_categories_preview(db: Session = Depends(get_db)):
    categories = (
        db.query(Category)
        .options(joinedload(Category.photos))
        .filter(Category.is_visible_on_website.is_(True))
        .order_by(Category.id.asc())
        .all()
    )

    category_ids = [category.id for category in categories]
    if not category_ids:
        return []

    products_by_category = {}
    products = (
        db.query(Product)
        .options(joinedload(Product.photos))
        .filter(
            Product.category_id.in_(category_ids),
            Product.is_visible_on_website.is_(True),
        )
        .order_by(Product.id.asc())
        .all()
    )

    for product in products:
        products_by_category.setdefault(product.category_id, []).append(product)

    response = []
    for category in categories:
        category_products = products_by_category.get(category.id, [])
        if not category_products:
            continue

        website_products = [
            WebsiteCategoryProduct(
                id=product.id,
                name=product.name,
                description=product.description,
                price=product.price,
                photos=product.photos,
            )
            for product in category_products
        ]

        response.append(
            WebsiteCategoryPreview(
                id=category.id,
                name=category.name,
                photos=category.photos,
                products=website_products,
            )
        )

    return response