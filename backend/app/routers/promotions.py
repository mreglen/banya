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
        promotion_type=getattr(promo, 'promotion_type', None) or 'standard',
        birthday_window_days=promo.birthday_window_days,
        reward_mode=promo.reward_mode,
        bonus_minutes=promo.bonus_minutes,
        discount_percent=promo.discount_percent,
        discount_amount=promo.discount_amount,
        gift_products=_build_gift_products(db, promo),
        incompatible_promotion_ids=get_incompatible_promotion_ids(db, promo.id),
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


def _has_standard_condition(**fields) -> bool:
    return any([
        fields.get('min_hours'),
        fields.get('min_guests'),
        fields.get('min_amount'),
        fields.get('applicable_weekdays'),
        fields.get('valid_from'),
        fields.get('valid_until'),
    ])


def _has_discount_reward(**fields) -> bool:
    return bool(fields.get('discount_percent') or fields.get('discount_amount'))


def _has_gift_reward(**fields) -> bool:
    return bool(fields.get('bonus_minutes') or fields.get('gift_products'))


def _validate_promotion_payload(
    *,
    promotion_type='standard',
    birthday_window_days=None,
    reward_mode=None,
    discount_percent=None,
    discount_amount=None,
    bonus_minutes=None,
    gift_products=None,
    min_hours,
    min_guests,
    min_amount,
    applicable_weekdays,
    valid_from,
    valid_until,
    is_create: bool = False,
):
    promotion_type = promotion_type or 'standard'
    gift_products = gift_products or []

    has_condition = _has_standard_condition(
        min_hours=min_hours,
        min_guests=min_guests,
        min_amount=min_amount,
        applicable_weekdays=applicable_weekdays,
        valid_from=valid_from,
        valid_until=valid_until,
    )
    if promotion_type == 'birthday':
        has_condition = True

    if is_create and not has_condition:
        raise HTTPException(
            status_code=400,
            detail="Должно быть заполнено хотя бы одно условие акции"
        )

    if promotion_type == 'birthday':
        if birthday_window_days is not None and birthday_window_days < 0:
            raise HTTPException(status_code=400, detail="Окно дня рождения не может быть отрицательным")
        if is_create and not reward_mode:
            raise HTTPException(status_code=400, detail="Укажите тип награды для акции «День рождения»")
        if reward_mode == 'discount' and not _has_discount_reward(
            discount_percent=discount_percent,
            discount_amount=discount_amount,
        ):
            raise HTTPException(status_code=400, detail="Укажите процент или сумму скидки")
        if reward_mode == 'gift' and not _has_gift_reward(
            bonus_minutes=bonus_minutes,
            gift_products=gift_products,
        ):
            raise HTTPException(status_code=400, detail="Укажите подарок: время или товар")
        if reward_mode == 'combined' and (
            not _has_discount_reward(discount_percent=discount_percent, discount_amount=discount_amount)
            or not _has_gift_reward(bonus_minutes=bonus_minutes, gift_products=gift_products)
        ):
            raise HTTPException(
                status_code=400,
                detail="Комбинированная акция требует и скидку, и подарок"
            )

    if discount_percent is not None and (discount_percent < 0 or discount_percent > 100):
        raise HTTPException(status_code=400, detail="Скидка в процентах должна быть от 0 до 100")
    if discount_amount is not None and discount_amount < 0:
        raise HTTPException(status_code=400, detail="Сумма скидки не может быть отрицательной")

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
        promotion_type=promotion_data.promotion_type,
        birthday_window_days=promotion_data.birthday_window_days,
        reward_mode=promotion_data.reward_mode,
        discount_percent=promotion_data.discount_percent,
        discount_amount=promotion_data.discount_amount,
        bonus_minutes=promotion_data.bonus_minutes,
        gift_products=promotion_data.gift_products,
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
        promotion_type=promotion_data.promotion_type or 'standard',
        birthday_window_days=promotion_data.birthday_window_days,
        reward_mode=promotion_data.reward_mode,
        bonus_minutes=promotion_data.bonus_minutes,
        discount_percent=promotion_data.discount_percent,
        discount_amount=promotion_data.discount_amount,
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
    promotion_type = promotion_data.promotion_type if promotion_data.promotion_type is not None else getattr(promo, 'promotion_type', 'standard')
    birthday_window_days = promotion_data.birthday_window_days if promotion_data.birthday_window_days is not None else promo.birthday_window_days
    reward_mode = promotion_data.reward_mode if promotion_data.reward_mode is not None else promo.reward_mode
    discount_percent = promotion_data.discount_percent if promotion_data.discount_percent is not None else promo.discount_percent
    discount_amount = promotion_data.discount_amount if promotion_data.discount_amount is not None else promo.discount_amount
    bonus_minutes = promotion_data.bonus_minutes if promotion_data.bonus_minutes is not None else promo.bonus_minutes
    _validate_promotion_payload(
        promotion_type=promotion_type,
        birthday_window_days=birthday_window_days,
        reward_mode=reward_mode,
        discount_percent=discount_percent,
        discount_amount=discount_amount,
        bonus_minutes=bonus_minutes,
        gift_products=promotion_data.gift_products if promotion_data.gift_products is not None else [gp for gp in promo.gift_products],
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
