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
from app.promotion_utils import (
    get_incompatible_promotion_ids,
    set_promotion_incompatibilities,
)
from datetime import date

router = APIRouter()


def _build_gift_products(db: Session, promo: Promotion) -> List[PromotionGiftProductResponse]:
    gift_products = []
    for gp in promo.gift_products:
        product = db.query(Product).filter(Product.id == gp.product_id).first()
        if product:
            gift_products.append(PromotionGiftProductResponse(
                product_id=gp.product_id,
                product_name=product.name,
                quantity=gp.quantity
            ))
    return gift_products


def _build_promotion_response(db: Session, promo: Promotion) -> PromotionResponse:
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
        gift_products=_build_gift_products(db, promo),
        incompatible_promotion_ids=get_incompatible_promotion_ids(db, promo.id),
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


def _validate_promotion_payload(
    *,
    min_hours,
    min_guests,
    min_amount,
    applicable_weekdays,
    valid_from,
    valid_until,
    is_create: bool = False,
):
    if is_create and not any([
        min_hours,
        min_guests,
        min_amount,
        applicable_weekdays,
        valid_from,
        valid_until
    ]):
        raise HTTPException(
            status_code=400,
            detail="Должно быть заполнено хотя бы одно условие акции"
        )

    if valid_from and valid_until and valid_from > valid_until:
        raise HTTPException(
            status_code=400,
            detail="Дата начала не может быть позже даты окончания"
        )

    if applicable_weekdays and not all(1 <= day <= 7 for day in applicable_weekdays):
        raise HTTPException(
            status_code=400,
            detail="Дни недели должны быть от 1 до 7 (1=пн, 7=вс)"
        )


@router.get("/promotions", response_model=List[PromotionResponse])
def get_promotions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    promotions = db.query(Promotion).offset(skip).limit(limit).all()
    return [_build_promotion_response(db, promo) for promo in promotions]


@router.get("/promotions/active", response_model=List[PromotionResponse])
def get_active_promotions(db: Session = Depends(get_db)):
    today = date.today()

    promotions = db.query(Promotion).filter(
        Promotion.is_active == True,
        (Promotion.valid_from == None) | (Promotion.valid_from <= today),
        (Promotion.valid_until == None) | (Promotion.valid_until >= today)
    ).all()

    return [_build_promotion_response(db, promo) for promo in promotions]


@router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
def get_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    return _build_promotion_response(db, promo)


@router.post("/promotions", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(
    promotion_data: PromotionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    _validate_promotion_payload(
        min_hours=promotion_data.min_hours,
        min_guests=promotion_data.min_guests,
        min_amount=promotion_data.min_amount,
        applicable_weekdays=promotion_data.applicable_weekdays,
        valid_from=promotion_data.valid_from,
        valid_until=promotion_data.valid_until,
        is_create=True,
    )

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
    db.flush()

    for gift_item in promotion_data.gift_products:
        product = db.query(Product).filter(Product.id == gift_item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"Товар с ID {gift_item.product_id} не найден"
            )

        db.add(PromotionGiftProduct(
            promotion_id=promo.id,
            product_id=gift_item.product_id,
            quantity=gift_item.quantity
        ))

    try:
        set_promotion_incompatibilities(
            db,
            promo.id,
            promotion_data.incompatible_promotion_ids,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    db.refresh(promo)
    return _build_promotion_response(db, promo)


@router.put("/promotions/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
    promotion_id: int,
    promotion_data: PromotionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")

    valid_from = promotion_data.valid_from if promotion_data.valid_from is not None else promo.valid_from
    valid_until = promotion_data.valid_until if promotion_data.valid_until is not None else promo.valid_until
    _validate_promotion_payload(
        min_hours=promotion_data.min_hours or promo.min_hours,
        min_guests=promotion_data.min_guests or promo.min_guests,
        min_amount=promotion_data.min_amount or promo.min_amount,
        applicable_weekdays=promotion_data.applicable_weekdays or promo.applicable_weekdays,
        valid_from=valid_from,
        valid_until=valid_until,
    )

    update_data = promotion_data.model_dump(exclude_unset=True)
    incompatible_ids = update_data.pop('incompatible_promotion_ids', None)
    gift_products = update_data.pop('gift_products', None)

    for key, value in update_data.items():
        setattr(promo, key, value)

    if gift_products is not None:
        db.query(PromotionGiftProduct).filter(
            PromotionGiftProduct.promotion_id == promotion_id
        ).delete()

        for gift_item in gift_products:
            product = db.query(Product).filter(Product.id == gift_item.product_id).first()
            if not product:
                db.rollback()
                raise HTTPException(
                    status_code=404,
                    detail=f"Товар с ID {gift_item.product_id} не найден"
                )

            db.add(PromotionGiftProduct(
                promotion_id=promotion_id,
                product_id=gift_item.product_id,
                quantity=gift_item.quantity
            ))

    if incompatible_ids is not None:
        try:
            set_promotion_incompatibilities(db, promotion_id, incompatible_ids)
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    db.refresh(promo)
    return _build_promotion_response(db, promo)


@router.delete("/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Акция не найдена")

    db.delete(promo)
    db.commit()
    return None
