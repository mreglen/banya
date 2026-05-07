from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import database, models, schemas
from app.auth import get_current_user


router = APIRouter(prefix="/organization", tags=["organization"])
admin_router = APIRouter(prefix="/admin/organization", tags=["organization"])


def check_admin_or_director(current_user: models.User = Depends(get_current_user)):
    if not (current_user.is_admin or current_user.is_director):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ разрешен только администратору или директору",
        )
    return current_user


def get_or_create_singleton(db: Session) -> models.OrganizationDetails:
    row = db.query(models.OrganizationDetails).filter(models.OrganizationDetails.id == 1).first()
    if row:
        return row
    row = models.OrganizationDetails(id=1, address="", inn="", kpp="", requisites="")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/", response_model=schemas.OrganizationDetailsOut)
def get_organization_details(db: Session = Depends(database.get_db)):
    return get_or_create_singleton(db)


@admin_router.get("/", response_model=schemas.OrganizationDetailsOut)
def admin_get_organization_details(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    return get_or_create_singleton(db)


@admin_router.put("/", response_model=schemas.OrganizationDetailsOut)
def admin_update_organization_details(
    payload: schemas.OrganizationDetailsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    row = get_or_create_singleton(db)
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(row, k, v if v is not None else getattr(row, k))
    db.commit()
    db.refresh(row)
    return row

