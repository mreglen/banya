from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models import EntranceDocument, EntranceDocumentItem, Product, OrganizationAccount
from app.schemas import EntranceDocumentCreate, EntranceDocumentRead
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


def _validate_products(db: Session, product_ids: List[int]):
    if not product_ids:
        raise HTTPException(status_code=400, detail="Items are required")
    existing_products = db.query(Product.id).filter(Product.id.in_(product_ids)).all()
    existing_ids = {p.id for p in existing_products}
    if len(existing_ids) != len(set(product_ids)):
        missing = set(product_ids) - existing_ids
        raise HTTPException(status_code=400, detail=f"Products not found: {missing}")


def _apply_stock_from_items(db: Session, items):
    markup = get_markup_percent(db)
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.total_quantity += item.quantity
            product.last_purchase_price = item.purchase_price
            product.price = price_from_purchase(item.purchase_price, markup)
            product.is_price_manual = False


@router.get("/", response_model=List[EntranceDocumentRead])
def get_documents(
    status_filter: Optional[str] = Query("posted", alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(EntranceDocument).options(
        joinedload(EntranceDocument.supplier),
        joinedload(EntranceDocument.items).joinedload(EntranceDocumentItem.product),
    )
    if status_filter:
        query = query.filter(EntranceDocument.status == status_filter)
    return query.order_by(EntranceDocument.id.desc()).all()


@router.get("/{doc_id}", response_model=EntranceDocumentRead)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    return _load_document(db, doc_id)


@router.post("/", response_model=EntranceDocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(doc: EntranceDocumentCreate, db: Session = Depends(get_db)):
    product_ids = [item.product_id for item in doc.items]
    _validate_products(db, product_ids)

    doc_status = doc.status or "posted"
    if doc_status not in ("draft", "posted"):
        raise HTTPException(status_code=400, detail="status должен быть draft или posted")

    if doc_status == "posted" and not doc.supplier_id:
        raise HTTPException(status_code=400, detail="Для проведения укажите поставщика")

    if doc.account_id:
        account = db.query(OrganizationAccount).filter(OrganizationAccount.id == doc.account_id).first()
        if not account:
            raise HTTPException(status_code=400, detail="Счет списания не найден")

    db_doc = EntranceDocument(
        date=doc.date,
        supplier_id=doc.supplier_id,
        responsible_name=doc.responsible_name,
        supplier_number=doc.supplier_number,
        comment=doc.comment,
        account_id=doc.account_id,
        total_amount=doc.total_amount,
        status=doc_status,
        created_from_request_id=doc.created_from_request_id,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    for item in doc.items:
        db.add(
            EntranceDocumentItem(
                document_id=db_doc.id,
                product_id=item.product_id,
                quantity=item.quantity,
                purchase_price=item.purchase_price,
            )
        )

    if doc_status == "posted":
        _apply_stock_from_items(db, doc.items)

    db.commit()
    return _load_document(db, db_doc.id)


@router.put("/{doc_id}", response_model=EntranceDocumentRead)
def update_document(doc_id: int, doc: EntranceDocumentCreate, db: Session = Depends(get_db)):
    db_doc = db.query(EntranceDocument).filter(EntranceDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    is_draft = (db_doc.status or "posted") == "draft"

    if doc.account_id:
        account = db.query(OrganizationAccount).filter(OrganizationAccount.id == doc.account_id).first()
        if not account:
            raise HTTPException(status_code=400, detail="Счет списания не найден")

    if is_draft:
        product_ids = [item.product_id for item in doc.items]
        _validate_products(db, product_ids)

        db_doc.date = doc.date
        db_doc.supplier_id = doc.supplier_id
        db_doc.responsible_name = doc.responsible_name
        db_doc.supplier_number = doc.supplier_number
        db_doc.comment = doc.comment
        db_doc.account_id = doc.account_id
        db_doc.total_amount = doc.total_amount
        # Keep draft status; posting is a separate endpoint
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
    else:
        # Posted docs: only comment (legacy behaviour for header soft-edit)
        db_doc.comment = doc.comment

    db.commit()
    return _load_document(db, doc_id)


@router.post("/{doc_id}/post", response_model=EntranceDocumentRead)
def post_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = _load_document(db, doc_id)
    if (db_doc.status or "posted") != "draft":
        raise HTTPException(status_code=400, detail="Провести можно только черновик")
    if not db_doc.supplier_id:
        raise HTTPException(status_code=400, detail="Укажите поставщика перед проведением")
    if not db_doc.items:
        raise HTTPException(status_code=400, detail="В документе нет позиций")

    _apply_stock_from_items(db, db_doc.items)
    db_doc.status = "posted"
    db.commit()
    return _load_document(db, doc_id)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db_doc = db.query(EntranceDocument).filter(EntranceDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(db_doc)
    db.commit()
    return
