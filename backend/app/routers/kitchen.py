# app/routers/kitchen.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import MenuItem, MenuCategory
from app.schemas import (
    MenuItemRead, MenuCategoryBase,
    MenuItemCreate, MenuItemUpdate,
    MenuCategoryCreate, MenuCategoryUpdate
)

router = APIRouter(prefix="/kitchen", tags=["kitchen"])

# ========================
# 📂 КАТЕГОРИИ — CRUD
# ========================

@router.get("/categories", response_model=List[MenuCategoryBase])
def get_categories(db: Session = Depends(get_db)):
    return db.query(MenuCategory).order_by(MenuCategory.order).all()

@router.post("/categories", response_model=MenuCategoryBase)
def create_category(category: MenuCategoryCreate, db: Session = Depends(get_db)):
    db_category = MenuCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=MenuCategoryBase)
def update_category(category_id: int, category: MenuCategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    for key, value in category.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    db.delete(db_category)
    db.commit()
    return {"message": "Категория удалена"}

# ========================
# 🍽️ ТОВАРЫ — CRUD
# ========================

@router.get("/", response_model=List[MenuItemRead])
def get_all_items(db: Session = Depends(get_db)):
    items = db.query(MenuItem).all()
    return [
        MenuItemRead(
            id=item.id,
            name=item.name,
            price=item.price,
            description=item.description,
            category=MenuCategoryBase(
                id=item.category_rel.id,
                slug=item.category_rel.slug,
                name=item.category_rel.name,
                order=item.category_rel.order,
            )
        )
        for item in items
    ]

@router.get("/{category_slug}", response_model=List[MenuItemRead])
def get_items_by_category(category_slug: str, db: Session = Depends(get_db)):
    category = db.query(MenuCategory).filter(MenuCategory.slug == category_slug).first()
    if not category:
        raise HTTPException(status_code=404, detail=f"Категория '{category_slug}' не найдена")

    items = db.query(MenuItem).filter(MenuItem.category_id == category.id).all()
    return [
        MenuItemRead(
            id=item.id,
            name=item.name,
            price=item.price,
            description=item.description,
            category=MenuCategoryBase(
                id=category.id,
                slug=category.slug,
                name=category.name,
                order=category.order,
            )
        )
        for item in items
    ]

# 👇 Создание товара
@router.post("/", response_model=MenuItemRead)
def create_item(item: MenuItemCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли категория
    category = db.query(MenuCategory).filter(MenuCategory.id == item.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    db_item = MenuItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Возвращаем с вложенной категорией
    return MenuItemRead(
        id=db_item.id,
        name=db_item.name,
        price=db_item.price,
        description=db_item.description,
        category=MenuCategoryBase(
            id=category.id,
            slug=category.slug,
            name=category.name,
            order=category.order,
        )
    )

# 👇 Обновление товара
@router.put("/{item_id}", response_model=MenuItemRead)
def update_item(item_id: int, item: MenuItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Если меняется категория — проверяем её существование
    if item.category_id:
        category = db.query(MenuCategory).filter(MenuCategory.id == item.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Категория не найдена")

    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    # Перезагружаем категорию для ответа
    category = db_item.category_rel
    return MenuItemRead(
        id=db_item.id,
        name=db_item.name,
        price=db_item.price,
        description=db_item.description,
        category=MenuCategoryBase(
            id=category.id,
            slug=category.slug,
            name=category.name,
            order=category.order,
        )
    )

# 👇 Удаление товара
@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Товар не найден")

    db.delete(db_item)
    db.commit()
    return {"message": "Товар удалён"}