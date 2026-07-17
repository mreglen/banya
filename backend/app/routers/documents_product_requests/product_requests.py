from datetime import date as dt_date, datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    EntranceDocument,
    EntranceDocumentItem,
    Product,
    ProductRequest,
    ProductRequestItem,
    User,
)
from app.schemas import (
    ProductRequestCreate,
    ProductRequestItemIds,
    ProductRequestRead,
    ProductRequestUpdate,
)

router = APIRouter(prefix="/admin/documents/product-requests", tags=["Documents - Product Requests"])


def check_admin_or_director(current_user: User = Depends(get_current_user)):
    if not (current_user.is_admin or current_user.is_director):
        raise HTTPException(status_code=403, detail="Доступ только для директора или администратора")
    return current_user


def _item_counts(items: List[ProductRequestItem]) -> dict:
    pending = sum(1 for i in items if i.status == "pending")
    approved = sum(1 for i in items if i.status == "approved")
    rejected = sum(1 for i in items if i.status == "rejected")
    return {
        "pending_count": pending,
        "approved_count": approved,
        "rejected_count": rejected,
    }


def _to_read(db_request: ProductRequest) -> dict:
    counts = _item_counts(db_request.items or [])
    return {
        "id": db_request.id,
        "date": db_request.date,
        "comment": db_request.comment,
        "created_by_user_id": db_request.created_by_user_id,
        "created_at": db_request.created_at,
        "updated_at": db_request.updated_at,
        "created_by": db_request.created_by,
        "items": db_request.items,
        **counts,
    }


def _load_request(db: Session, request_id: int) -> ProductRequest:
    db_request = (
        db.query(ProductRequest)
        .options(
            joinedload(ProductRequest.created_by),
            joinedload(ProductRequest.items).joinedload(ProductRequestItem.product),
        )
        .filter(ProductRequest.id == request_id)
        .first()
    )
    if not db_request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return db_request


@router.get("/", response_model=List[ProductRequestRead])
def list_product_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = (
        db.query(ProductRequest)
        .options(
            joinedload(ProductRequest.created_by),
            joinedload(ProductRequest.items).joinedload(ProductRequestItem.product),
        )
        .order_by(ProductRequest.id.desc())
        .all()
    )
    return [_to_read(r) for r in requests]


@router.get("/{request_id}/", response_model=ProductRequestRead)
def get_product_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_read(_load_request(db, request_id))


@router.post("/", response_model=ProductRequestRead, status_code=status.HTTP_201_CREATED)
def create_product_request(
    payload: ProductRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы одну позицию")

    product_ids = [item.product_id for item in payload.items]
    existing = {p.id for p in db.query(Product.id).filter(Product.id.in_(product_ids)).all()}
    missing = set(product_ids) - existing
    if missing:
        raise HTTPException(status_code=400, detail=f"Товары не найдены: {missing}")

    db_request = ProductRequest(
        date=payload.date or dt_date.today(),
        comment=payload.comment,
        created_by_user_id=current_user.user_id,
    )
    db.add(db_request)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Количество должно быть больше 0")
        db.add(
            ProductRequestItem(
                request_id=db_request.id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price or 0,
                status="pending",
                added_by_user_id=current_user.user_id,
            )
        )

    db.commit()
    return _to_read(_load_request(db, db_request.id))


@router.put("/{request_id}/", response_model=ProductRequestRead)
def update_product_request(
    request_id: int,
    payload: ProductRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_request = _load_request(db, request_id)
    pending_items = [i for i in db_request.items if i.status == "pending"]
    if not pending_items and not payload.items:
        raise HTTPException(status_code=400, detail="Заявка закрыта: нет позиций для изменения")

    has_pending = any(i.status == "pending" for i in db_request.items)
    if not has_pending:
        raise HTTPException(
            status_code=400,
            detail="Нельзя редактировать заявку без открытых (pending) позиций",
        )

    if payload.date is not None:
        db_request.date = payload.date
    if payload.comment is not None:
        db_request.comment = payload.comment

    # Remove only pending items; keep approved/rejected history
    for item in list(pending_items):
        db.delete(item)
    db.flush()

    if not payload.items:
        raise HTTPException(status_code=400, detail="В заявке должна остаться хотя бы одна pending-позиция")

    product_ids = [item.product_id for item in payload.items]
    existing = {p.id for p in db.query(Product.id).filter(Product.id.in_(product_ids)).all()}
    missing = set(product_ids) - existing
    if missing:
        raise HTTPException(status_code=400, detail=f"Товары не найдены: {missing}")

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Количество должно быть больше 0")
        db.add(
            ProductRequestItem(
                request_id=db_request.id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price or 0,
                status="pending",
                added_by_user_id=current_user.user_id,
            )
        )

    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/{request_id}/approve", response_model=ProductRequestRead)
def approve_product_request_items(
    request_id: int,
    payload: ProductRequestItemIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_director),
):
    if not payload.item_ids:
        raise HTTPException(status_code=400, detail="Выберите позиции для подтверждения")

    db_request = _load_request(db, request_id)
    items_map = {i.id: i for i in db_request.items}
    selected = []
    for item_id in payload.item_ids:
        item = items_map.get(item_id)
        if not item:
            raise HTTPException(status_code=400, detail=f"Позиция {item_id} не найдена в заявке")
        if item.status != "pending":
            raise HTTPException(status_code=400, detail=f"Позиция {item_id} уже обработана")
        selected.append(item)

    total_amount = sum(i.quantity * float(i.purchase_price or 0) for i in selected)
    draft = EntranceDocument(
        date=dt_date.today(),
        supplier_id=None,
        responsible_name=current_user.full_name or "Директор",
        comment=f"Из заявки #{db_request.id}",
        total_amount=total_amount,
        status="draft",
        created_from_request_id=db_request.id,
    )
    db.add(draft)
    db.flush()

    now = datetime.now(timezone.utc)
    for item in selected:
        db.add(
            EntranceDocumentItem(
                document_id=draft.id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price or 0,
            )
        )
        item.status = "approved"
        item.processed_by_user_id = current_user.user_id
        item.processed_at = now
        item.entrance_document_id = draft.id

    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/{request_id}/reject", response_model=ProductRequestRead)
def reject_product_request_items(
    request_id: int,
    payload: ProductRequestItemIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_director),
):
    if not payload.item_ids:
        raise HTTPException(status_code=400, detail="Выберите позиции для отклонения")

    db_request = _load_request(db, request_id)
    items_map = {i.id: i for i in db_request.items}
    now = datetime.now(timezone.utc)

    for item_id in payload.item_ids:
        item = items_map.get(item_id)
        if not item:
            raise HTTPException(status_code=400, detail=f"Позиция {item_id} не найдена в заявке")
        if item.status != "pending":
            raise HTTPException(status_code=400, detail=f"Позиция {item_id} уже обработана")
        item.status = "rejected"
        item.processed_by_user_id = current_user.user_id
        item.processed_at = now

    db.commit()
    return _to_read(_load_request(db, request_id))
