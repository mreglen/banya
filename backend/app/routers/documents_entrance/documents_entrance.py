from datetime import date as dt_date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    EntranceDocument,
    EntranceDocumentItem,
    Product,
    ProductRequestItem,
    OrganizationAccount,
    User,
)
from app.schemas import EntranceDocumentCreate, EntranceDocumentRead, EntranceReceiveCreate
from app.pricing import get_markup_percent, price_from_purchase

router = APIRouter(prefix="/admin/documents/entrance", tags=["Documents - Entrance"])


def _load_document(db: Session, doc_id: int) -> EntranceDocument:
    doc = (
        db.query(EntranceDocument)
        .options(
            joinedload(EntranceDocument.supplier),
            joinedload(EntranceDocument.items).joinedload(EntranceDocumentItem.product),
        )
        .filter(EntranceDocument.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def _validate_account(db: Session, account_id: Optional[int]):
    if not account_id:
        return
    account = db.query(OrganizationAccount).filter(OrganizationAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Счет списания не найден")


def _load_countable_products(db: Session, product_ids: List[int]) -> dict:
    if not product_ids:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы один товар")
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_map = {p.id: p for p in products}
    missing = set(product_ids) - set(product_map)
    if missing:
        raise HTTPException(status_code=400, detail=f"Товары не найдены: {missing}")
    non_countable = [product_map[pid].name for pid in product_ids if not product_map[pid].is_countable]
    if non_countable:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя оприходовать неисчисляемые товары: {', '.join(non_countable)}",
        )
    return product_map


def _apply_stock_from_items(db: Session, items, *, update_sale_prices: bool = True, reverse: bool = False):
    """Применить остатки. reverse=True — откат (сторно)."""
    markup = get_markup_percent(db)
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or not product.is_countable:
            continue
        qty = int(item.quantity)
        if reverse:
            product.total_quantity = (product.total_quantity or 0) - qty
            continue
        product.total_quantity = (product.total_quantity or 0) + qty
        product.last_purchase_price = float(item.purchase_price or 0)
        if update_sale_prices and not product.is_price_manual:
            product.price = price_from_purchase(float(item.purchase_price or 0), markup)
            product.is_price_manual = False


def _link_request_items(db: Session, request_id: Optional[int], entrance_id: int):
    if not request_id:
        return
    items = (
        db.query(ProductRequestItem)
        .filter(
            ProductRequestItem.request_id == request_id,
            ProductRequestItem.status == "approved",
            ProductRequestItem.entrance_document_id.is_(None),
        )
        .all()
    )
    for item in items:
        item.entrance_document_id = entrance_id


def _create_posted_document(
    db: Session,
    *,
    date_value: dt_date,
    responsible_name: str,
    comment: Optional[str],
    account_id: Optional[int],
    items,
    update_sale_prices: bool = True,
    created_from_request_id: Optional[int] = None,
    reverses_id: Optional[int] = None,
    apply_stock: bool = True,
    reverse_stock: bool = False,
) -> EntranceDocument:
    product_ids = [item.product_id for item in items]
    _load_countable_products(db, product_ids)
    _validate_account(db, account_id)

    for item in items:
        if int(item.quantity) == 0:
            raise HTTPException(status_code=400, detail="Количество не может быть 0")
        if float(item.purchase_price or 0) < 0:
            raise HTTPException(status_code=400, detail="Цена закупки не может быть отрицательной")

    total_amount = sum(int(item.quantity) * float(item.purchase_price or 0) for item in items)

    db_doc = EntranceDocument(
        date=date_value,
        supplier_id=None,
        responsible_name=responsible_name,
        supplier_number=None,
        comment=comment,
        account_id=account_id,
        total_amount=total_amount,
        status="posted",
        created_from_request_id=created_from_request_id,
        reverses_id=reverses_id,
    )
    db.add(db_doc)
    db.flush()

    for item in items:
        db.add(
            EntranceDocumentItem(
                document_id=db_doc.id,
                product_id=item.product_id,
                quantity=int(item.quantity),
                purchase_price=float(item.purchase_price or 0),
            )
        )

    if apply_stock:
        _apply_stock_from_items(
            db,
            items,
            update_sale_prices=update_sale_prices and not reverse_stock,
            reverse=reverse_stock,
        )

    if created_from_request_id and not reverses_id:
        _link_request_items(db, created_from_request_id, db_doc.id)

    db.commit()
    return _load_document(db, db_doc.id)


@router.get("/", response_model=List[EntranceDocumentRead])
def get_documents(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """Журнал: по умолчанию все не-draft (posted + reversed)."""
    query = db.query(EntranceDocument).options(
        joinedload(EntranceDocument.supplier),
        joinedload(EntranceDocument.items).joinedload(EntranceDocumentItem.product),
    )
    if status_filter:
        query = query.filter(EntranceDocument.status == status_filter)
    else:
        query = query.filter(EntranceDocument.status != "draft")
    return query.order_by(EntranceDocument.id.desc()).all()


@router.post("/receive", response_model=EntranceDocumentRead, status_code=status.HTTP_201_CREATED)
def receive_stock(
    payload: EntranceReceiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы один товар")
    for item in payload.items:
        if int(item.quantity) <= 0:
            raise HTTPException(status_code=400, detail="Количество должно быть больше 0")

    responsible = (payload.responsible_name or "").strip() or (
        current_user.full_name or "Пользователь"
    )
    return _create_posted_document(
        db,
        date_value=payload.date or dt_date.today(),
        responsible_name=responsible,
        comment=payload.comment,
        account_id=payload.account_id,
        items=payload.items,
        update_sale_prices=payload.update_sale_prices,
        created_from_request_id=payload.created_from_request_id,
    )


@router.get("/{doc_id}", response_model=EntranceDocumentRead)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    return _load_document(db, doc_id)


@router.post("/{doc_id}/storno", response_model=EntranceDocumentRead, status_code=status.HTTP_201_CREATED)
def storno_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original = _load_document(db, doc_id)
    if (original.status or "posted") != "posted":
        raise HTTPException(status_code=400, detail="Сторно только для проведённого поступления")
    if original.reversed_by_id:
        raise HTTPException(status_code=400, detail="Документ уже сторнирован")
    if original.reverses_id:
        raise HTTPException(status_code=400, detail="Нельзя сторнировать документ сторно")
    if not original.items:
        raise HTTPException(status_code=400, detail="В документе нет позиций")

    class _Item:
        def __init__(self, product_id, quantity, purchase_price):
            self.product_id = product_id
            self.quantity = quantity
            self.purchase_price = purchase_price

    # Положительные qty в сторно-доке; склад откатываем через reverse=True
    mirror_items = [
        _Item(rp.product_id, abs(int(rp.quantity)), float(rp.purchase_price or 0))
        for rp in original.items
    ]
    responsible = current_user.full_name or "Пользователь"
    storno_doc = _create_posted_document(
        db,
        date_value=dt_date.today(),
        responsible_name=responsible,
        comment=f"Сторно поступления #{original.id}",
        account_id=original.account_id,
        items=mirror_items,
        update_sale_prices=False,
        created_from_request_id=None,
        reverses_id=original.id,
        apply_stock=True,
        reverse_stock=True,
    )

    # total_amount для финансов — отрицательный; оригинал остаётся posted (чтобы +/− дали 0)
    storno_loaded = db.query(EntranceDocument).filter(EntranceDocument.id == storno_doc.id).first()
    original_reloaded = db.query(EntranceDocument).filter(EntranceDocument.id == doc_id).first()
    storno_loaded.total_amount = -abs(float(original_reloaded.total_amount or 0))
    original_reloaded.reversed_by_id = storno_doc.id
    db.commit()
    return _load_document(db, storno_doc.id)


@router.post("/", response_model=EntranceDocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(
    doc: EntranceDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Legacy: draft или posted. Новый UI использует /receive."""
    product_ids = [item.product_id for item in doc.items]
    _load_countable_products(db, product_ids)
    _validate_account(db, doc.account_id)

    doc_status = doc.status or "posted"
    if doc_status not in ("draft", "posted"):
        raise HTTPException(status_code=400, detail="status должен быть draft или posted")

    if doc_status == "posted":
        return _create_posted_document(
            db,
            date_value=doc.date,
            responsible_name=doc.responsible_name,
            comment=doc.comment,
            account_id=doc.account_id,
            items=doc.items,
            update_sale_prices=True,
            created_from_request_id=doc.created_from_request_id,
        )

    db_doc = EntranceDocument(
        date=doc.date,
        supplier_id=doc.supplier_id,
        responsible_name=doc.responsible_name,
        supplier_number=doc.supplier_number,
        comment=doc.comment,
        account_id=doc.account_id,
        total_amount=doc.total_amount,
        status="draft",
        created_from_request_id=doc.created_from_request_id,
    )
    db.add(db_doc)
    db.flush()
    for item in doc.items:
        db.add(
            EntranceDocumentItem(
                document_id=db_doc.id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price,
            )
        )
    db.commit()
    return _load_document(db, db_doc.id)


@router.put("/{doc_id}", response_model=EntranceDocumentRead)
def update_document(doc_id: int, doc: EntranceDocumentCreate, db: Session = Depends(get_db)):
    db_doc = db.query(EntranceDocument).filter(EntranceDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    is_draft = (db_doc.status or "posted") == "draft"
    if not is_draft:
        raise HTTPException(status_code=400, detail="Проведённый документ нельзя редактировать")

    _validate_account(db, doc.account_id)
    product_ids = [item.product_id for item in doc.items]
    _load_countable_products(db, product_ids)

    db_doc.date = doc.date
    db_doc.supplier_id = doc.supplier_id
    db_doc.responsible_name = doc.responsible_name
    db_doc.supplier_number = doc.supplier_number
    db_doc.comment = doc.comment
    db_doc.account_id = doc.account_id
    db_doc.total_amount = doc.total_amount
    db_doc.status = "draft"

    db.query(EntranceDocumentItem).filter(EntranceDocumentItem.document_id == doc_id).delete()
    for item in doc.items:
        db.add(
            EntranceDocumentItem(
                document_id=doc_id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price,
            )
        )
    db.commit()
    return _load_document(db, doc_id)


@router.post("/{doc_id}/post", response_model=EntranceDocumentRead)
def post_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = _load_document(db, doc_id)
    if (db_doc.status or "posted") != "draft":
        raise HTTPException(status_code=400, detail="Провести можно только черновик")
    if not db_doc.items:
        raise HTTPException(status_code=400, detail="В документе нет позиций")

    _apply_stock_from_items(db, db_doc.items, update_sale_prices=True)
    db_doc.status = "posted"
    if db_doc.created_from_request_id:
        _link_request_items(db, db_doc.created_from_request_id, db_doc.id)
    db.commit()
    return _load_document(db, doc_id)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(EntranceDocument).filter(EntranceDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if (db_doc.status or "posted") != "draft":
        raise HTTPException(status_code=400, detail="Удалить можно только черновик. Для проведённых — сторно.")
    db.delete(db_doc)
    db.commit()
    return
