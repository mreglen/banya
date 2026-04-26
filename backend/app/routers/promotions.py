from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Promotion, PromotionGiftProduct, Product
from app.schemas import (
    PromotionCreate,
    PromotionUpdate,
    PromotionResponse,
    PromotionGiftProductResponse
)
from app.auth import get_current_user
from datetime import date

router = APIRouter()


@router.get("/promotions", response_model=List[PromotionResponse])
def get_promotions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить все акции"""
    promotions = db.query(Promotion).offset(skip).limit(limit).all()
    
    # Формируем ответ с товарами
    result = []
    for promo in promotions:
        gift_products = []
        for gp in promo.gift_products:
            product = db.query(Product).filter(Product.id == gp.product_id).first()
            if product:
                gift_products.append(PromotionGiftProductResponse(
                    product_id=gp.product_id,
                    product_name=product.name,
                    quantity=gp.quantity
                ))
        
        result.append(PromotionResponse(
            id=promo.id,
            name=promo.name,
            description=promo.description,
            is_active=promo.is_active,
            min_hours=promo.min_hours,
            min_guests=promo.min_guests,
            min_amount=promo.min_amount,
            applicable_weekdays=promo.applicable_weekdays,
            valid_from=promo.valid_from,
            valid_until=promo.valid_until,
            bonus_minutes=promo.bonus_minutes,
            gift_products=gift_products,
            created_at=promo.created_at,
            updated_at=promo.updated_at
        ))
    
    return result


@router.get("/promotions/active", response_model=List[PromotionResponse])
def get_active_promotions(db: Session = Depends(get_db)):
    """Получить активные акции (для сайта)"""
    today = date.today()
    
    promotions = db.query(Promotion).filter(
        Promotion.is_active == True,
        (Promotion.valid_from == None) | (Promotion.valid_from <= today),
        (Promotion.valid_until == None) | (Promotion.valid_until >= today)
    ).all()
    
    result = []
    for promo in promotions:
        gift_products = []
        for gp in promo.gift_products:
            product = db.query(Product).filter(Product.id == gp.product_id).first()
            if product:
                gift_products.append(PromotionGiftProductResponse(
                    product_id=gp.product_id,
                    product_name=product.name,
                    quantity=gp.quantity
                ))
        
        result.append(PromotionResponse(
            id=promo.id,
            name=promo.name,
            description=promo.description,
            is_active=promo.is_active,
            min_hours=promo.min_hours,
            min_guests=promo.min_guests,
            min_amount=promo.min_amount,
            applicable_weekdays=promo.applicable_weekdays,
            valid_from=promo.valid_from,
            valid_until=promo.valid_until,
            bonus_minutes=promo.bonus_minutes,
            gift_products=gift_products,
            created_at=promo.created_at,
            updated_at=promo.updated_at
        ))
    
    return result


@router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
def get_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить одну акцию"""
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    
    gift_products = []
    for gp in promo.gift_products:
        product = db.query(Product).filter(Product.id == gp.product_id).first()
        if product:
            gift_products.append(PromotionGiftProductResponse(
                product_id=gp.product_id,
                product_name=product.name,
                quantity=gp.quantity
            ))
    
    return PromotionResponse(
        id=promo.id,
        name=promo.name,
        description=promo.description,
        is_active=promo.is_active,
        min_hours=promo.min_hours,
        min_guests=promo.min_guests,
        min_amount=promo.min_amount,
        applicable_weekdays=promo.applicable_weekdays,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        bonus_minutes=promo.bonus_minutes,
        gift_products=gift_products,
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


@router.post("/promotions", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(
    promotion_data: PromotionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Создать акцию"""
    # Валидация: хотя бы одно условие должно быть заполнено
    if not any([
        promotion_data.min_hours,
        promotion_data.min_guests,
        promotion_data.min_amount,
        promotion_data.applicable_weekdays,
        promotion_data.valid_from,
        promotion_data.valid_until
    ]):
        raise HTTPException(
            status_code=400,
            detail="Должно быть заполнено хотя бы одно условие акции"
        )
    
    # Валидация дат
    if promotion_data.valid_from and promotion_data.valid_until:
        if promotion_data.valid_from > promotion_data.valid_until:
            raise HTTPException(
                status_code=400,
                detail="Дата начала не может быть позже даты окончания"
            )
    
    # Валидация дней недели
    if promotion_data.applicable_weekdays:
        if not all(1 <= day <= 7 for day in promotion_data.applicable_weekdays):
            raise HTTPException(
                status_code=400,
                detail="Дни недели должны быть от 1 до 7 (1=пн, 7=вс)"
            )
    
    # Создание акции
    promo = Promotion(
        name=promotion_data.name,
        description=promotion_data.description,
        is_active=promotion_data.is_active,
        min_hours=promotion_data.min_hours,
        min_guests=promotion_data.min_guests,
        min_amount=promotion_data.min_amount,
        applicable_weekdays=promotion_data.applicable_weekdays,
        valid_from=promotion_data.valid_from,
        valid_until=promotion_data.valid_until,
        bonus_minutes=promotion_data.bonus_minutes
    )
    
    db.add(promo)
    db.flush()  # Получаем ID акции
    
    # Добавление товаров в подарок
    for gift_item in promotion_data.gift_products:
        # Проверка существования товара
        product = db.query(Product).filter(Product.id == gift_item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"Товар с ID {gift_item.product_id} не найден"
            )
        
        gift_product = PromotionGiftProduct(
            promotion_id=promo.id,
            product_id=gift_item.product_id,
            quantity=gift_item.quantity
        )
        db.add(gift_product)
    
    db.commit()
    db.refresh(promo)
    
    # Формируем ответ
    gift_products = []
    for gp in promo.gift_products:
        product = db.query(Product).filter(Product.id == gp.product_id).first()
        if product:
            gift_products.append(PromotionGiftProductResponse(
                product_id=gp.product_id,
                product_name=product.name,
                quantity=gp.quantity
            ))
    
    return PromotionResponse(
        id=promo.id,
        name=promo.name,
        description=promo.description,
        is_active=promo.is_active,
        min_hours=promo.min_hours,
        min_guests=promo.min_guests,
        min_amount=promo.min_amount,
        applicable_weekdays=promo.applicable_weekdays,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        bonus_minutes=promo.bonus_minutes,
        gift_products=gift_products,
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


@router.put("/promotions/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
    promotion_id: int,
    promotion_data: PromotionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Обновить акцию"""
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    
    # Валидация дат
    valid_from = promotion_data.valid_from or promo.valid_from
    valid_until = promotion_data.valid_until or promo.valid_until
    if valid_from and valid_until and valid_from > valid_until:
        raise HTTPException(
            status_code=400,
            detail="Дата начала не может быть позже даты окончания"
        )
    
    # Валидация дней недели
    if promotion_data.applicable_weekdays:
        if not all(1 <= day <= 7 for day in promotion_data.applicable_weekdays):
            raise HTTPException(
                status_code=400,
                detail="Дни недели должны быть от 1 до 7 (1=пн, 7=вс)"
            )
    
    # Обновление полей
    update_data = promotion_data.dict(exclude_unset=True)
    
    # Обработка gift_products отдельно
    if 'gift_products' in update_data:
        del update_data['gift_products']
    
    for key, value in update_data.items():
        setattr(promo, key, value)
    
    # Обновление товаров в подарок
    if promotion_data.gift_products is not None:
        # Удаляем старые
        db.query(PromotionGiftProduct).filter(
            PromotionGiftProduct.promotion_id == promotion_id
        ).delete()
        
        # Добавляем новые
        for gift_item in promotion_data.gift_products:
            product = db.query(Product).filter(Product.id == gift_item.product_id).first()
            if not product:
                db.rollback()
                raise HTTPException(
                    status_code=404,
                    detail=f"Товар с ID {gift_item.product_id} не найден"
                )
            
            gift_product = PromotionGiftProduct(
                promotion_id=promotion_id,
                product_id=gift_item.product_id,
                quantity=gift_item.quantity
            )
            db.add(gift_product)
    
    db.commit()
    db.refresh(promo)
    
    # Формируем ответ
    gift_products = []
    for gp in promo.gift_products:
        product = db.query(Product).filter(Product.id == gp.product_id).first()
        if product:
            gift_products.append(PromotionGiftProductResponse(
                product_id=gp.product_id,
                product_name=product.name,
                quantity=gp.quantity
            ))
    
    return PromotionResponse(
        id=promo.id,
        name=promo.name,
        description=promo.description,
        is_active=promo.is_active,
        min_hours=promo.min_hours,
        min_guests=promo.min_guests,
        min_amount=promo.min_amount,
        applicable_weekdays=promo.applicable_weekdays,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        bonus_minutes=promo.bonus_minutes,
        gift_products=gift_products,
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


@router.delete("/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Удалить акцию"""
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    
    db.delete(promo)
    db.commit()
    
    return None
