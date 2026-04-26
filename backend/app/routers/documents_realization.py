from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import RealizationDocument, RealizationDocumentItem, Product, Reservation
from app.schemas import RealizationDocumentRead

router = APIRouter(prefix="/admin/documents/realization", tags=["Documents - Realization"])


@router.get("/", response_model=List[RealizationDocumentRead])
def get_realization_documents(db: Session = Depends(get_db)):
    return db.query(RealizationDocument)\
             .options(
                 joinedload(RealizationDocument.items)
                 .joinedload(RealizationDocumentItem.product)
             )\
             .all()


@router.get("/{doc_id}", response_model=RealizationDocumentRead)
def get_realization_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(RealizationDocument)\
             .options(
                 joinedload(RealizationDocument.items)
                 .joinedload(RealizationDocumentItem.product)
             )\
             .filter(RealizationDocument.id == doc_id)\
             .first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_realization_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(RealizationDocument).filter(RealizationDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Возвращаем товары на склад
        for item in doc.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.total_quantity += item.quantity
        
        # Удаляем бронь
        db.query(Reservation).filter(
            Reservation.reservation_id == doc.reservation_id
        ).delete()
        
        # Удаляем документ и элементы
        db.delete(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка удаления документа реализации: {str(e)}"
        )
    return
