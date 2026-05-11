from datetime import date, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import database, models, schemas
from app.auth import get_current_user


router = APIRouter(prefix="/finance", tags=["finance"])
admin_router = APIRouter(prefix="/admin/finance", tags=["finance"])


def check_admin_or_director(current_user: models.User = Depends(get_current_user)):
    if not (current_user.is_admin or current_user.is_director):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ разрешен только администратору или директору",
        )
    return current_user


def _resolve_period(
    period: str,
    date_from: Optional[date],
    date_to: Optional[date],
) -> Tuple[Optional[date], Optional[date]]:
    today = date.today()
    if period == "month":
        start = today.replace(day=1)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1) - timedelta(days=1)
        else:
            end = start.replace(month=start.month + 1) - timedelta(days=1)
        return start, end
    if period == "custom":
        if not date_from or not date_to:
            raise HTTPException(status_code=400, detail="Для custom периода нужны date_from и date_to")
        if date_from > date_to:
            raise HTTPException(status_code=400, detail="date_from не может быть больше date_to")
        return date_from, date_to
    if period == "all":
        return None, None
    raise HTTPException(status_code=400, detail="Некорректный период. Допустимо: month, custom, all")


@router.get("/accounts", response_model=List[schemas.OrganizationAccountOut])
def get_accounts(
    active_only: bool = Query(False),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.OrganizationAccount)
    if active_only:
        query = query.filter(models.OrganizationAccount.is_active == True)
    return query.order_by(models.OrganizationAccount.id.asc()).all()


@admin_router.post("/accounts", response_model=schemas.OrganizationAccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: schemas.OrganizationAccountCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    row = models.OrganizationAccount(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@admin_router.put("/accounts/{account_id}", response_model=schemas.OrganizationAccountOut)
def update_account(
    account_id: int,
    payload: schemas.OrganizationAccountUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    row = db.query(models.OrganizationAccount).filter(models.OrganizationAccount.id == account_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Счет не найден")
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@admin_router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(check_admin_or_director),
):
    row = db.query(models.OrganizationAccount).filter(models.OrganizationAccount.id == account_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Счет не найден")
    db.delete(row)
    db.commit()
    return


@router.get("/operations", response_model=schemas.FinanceOperationsResponse)
def get_operations(
    operation_type: str = Query("all", pattern="^(all|income|expense)$"),
    period: str = Query("month", pattern="^(month|custom|all)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    account_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    period_start, period_end = _resolve_period(period, date_from, date_to)
    operations = []

    if operation_type in ("all", "expense"):
        query = db.query(models.EntranceDocument).options(joinedload(models.EntranceDocument.supplier))
        if period_start:
            query = query.filter(models.EntranceDocument.date >= period_start)
        if period_end:
            query = query.filter(models.EntranceDocument.date <= period_end)
        if account_id is not None:
            query = query.filter(models.EntranceDocument.account_id == account_id)
        for row in query.all():
            operations.append(
                schemas.FinanceOperationOut(
                    source="entrance",
                    operation_type="expense",
                    id=row.id,
                    date=row.date,
                    amount=float(row.total_amount or 0),
                    title=row.supplier.supplier_name if row.supplier else "Поступление",
                    subtitle=row.comment,
                    account_id=row.account_id,
                )
            )
        # Корректировки по броням: отрицательные realization считаем расходом
        realization_expense_query = db.query(models.RealizationDocument).options(joinedload(models.RealizationDocument.bath))
        if period_start:
            realization_expense_query = realization_expense_query.filter(models.RealizationDocument.date >= period_start)
        if period_end:
            realization_expense_query = realization_expense_query.filter(models.RealizationDocument.date <= period_end)
        if account_id is not None:
            realization_expense_query = realization_expense_query.filter(models.RealizationDocument.account_id == account_id)
        realization_expense_query = realization_expense_query.filter(models.RealizationDocument.total_amount < 0)
        for row in realization_expense_query.all():
            operations.append(
                schemas.FinanceOperationOut(
                    source="realization",
                    operation_type="expense",
                    id=row.id,
                    date=row.date,
                    amount=abs(float(row.total_amount or 0)),
                    title=row.client_name or "Корректировка по брони",
                    subtitle=(f"Отмена закрытия • {row.bath.name}" if row.bath else "Отмена закрытия"),
                    account_id=row.account_id,
                )
            )

    if operation_type in ("all", "income"):
        query = db.query(models.RealizationDocument).options(joinedload(models.RealizationDocument.bath))
        if period_start:
            query = query.filter(models.RealizationDocument.date >= period_start)
        if period_end:
            query = query.filter(models.RealizationDocument.date <= period_end)
        if account_id is not None:
            query = query.filter(models.RealizationDocument.account_id == account_id)
        query = query.filter(models.RealizationDocument.total_amount >= 0)
        for row in query.all():
            operations.append(
                schemas.FinanceOperationOut(
                    source="realization",
                    operation_type="income",
                    id=row.id,
                    date=row.date,
                    amount=abs(float(row.total_amount or 0)),
                    title=row.client_name or "Реализация",
                    subtitle=row.bath.name if row.bath else None,
                    account_id=row.account_id,
                )
            )

    operations.sort(key=lambda item: (item.date, item.id), reverse=True)
    total = len(operations)
    return schemas.FinanceOperationsResponse(items=operations[skip: skip + limit], total=total)


@router.get("/summary", response_model=schemas.FinanceSummaryOut)
def get_summary(
    period: str = Query("month", pattern="^(month|custom|all)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    account_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    period_start, period_end = _resolve_period(period, date_from, date_to)

    expense_query = db.query(models.EntranceDocument)
    income_query = db.query(models.RealizationDocument).filter(models.RealizationDocument.total_amount >= 0)
    realization_expense_query = db.query(models.RealizationDocument).filter(models.RealizationDocument.total_amount < 0)

    if period_start:
        expense_query = expense_query.filter(models.EntranceDocument.date >= period_start)
        income_query = income_query.filter(models.RealizationDocument.date >= period_start)
        realization_expense_query = realization_expense_query.filter(models.RealizationDocument.date >= period_start)
    if period_end:
        expense_query = expense_query.filter(models.EntranceDocument.date <= period_end)
        income_query = income_query.filter(models.RealizationDocument.date <= period_end)
        realization_expense_query = realization_expense_query.filter(models.RealizationDocument.date <= period_end)
    if account_id is not None:
        expense_query = expense_query.filter(models.EntranceDocument.account_id == account_id)
        income_query = income_query.filter(models.RealizationDocument.account_id == account_id)
        realization_expense_query = realization_expense_query.filter(models.RealizationDocument.account_id == account_id)

    entrance_expense = sum(float(item.total_amount or 0) for item in expense_query.all())
    realization_expense = sum(abs(float(item.total_amount or 0)) for item in realization_expense_query.all())
    expense = entrance_expense + realization_expense
    income = sum(float(item.total_amount or 0) for item in income_query.all())

    return schemas.FinanceSummaryOut(
        income=income,
        expense=expense,
        result=income - expense,
    )


@router.get("/operation/{source}/{operation_id}", response_model=schemas.FinanceOperationDetailOut)
def get_operation_detail(
    source: str,
    operation_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if source == "entrance":
        row = (
            db.query(models.EntranceDocument)
            .options(
                joinedload(models.EntranceDocument.supplier),
                joinedload(models.EntranceDocument.items).joinedload(models.EntranceDocumentItem.product),
            )
            .filter(models.EntranceDocument.id == operation_id)
            .first()
        )
        if not row:
            raise HTTPException(status_code=404, detail="Операция не найдена")
        payload = {
            "supplier_name": row.supplier.supplier_name if row.supplier else None,
            "responsible_name": row.responsible_name,
            "supplier_number": row.supplier_number,
            "comment": row.comment,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else None,
                    "quantity": item.quantity,
                    "purchase_price": float(item.purchase_price or 0),
                }
                for item in row.items
            ],
        }
        return schemas.FinanceOperationDetailOut(
            source="entrance",
            operation_type="expense",
            id=row.id,
            date=row.date,
            amount=float(row.total_amount or 0),
            account_id=row.account_id,
            payload=payload,
        )

    if source == "realization":
        row = (
            db.query(models.RealizationDocument)
            .options(
                joinedload(models.RealizationDocument.bath),
                joinedload(models.RealizationDocument.items).joinedload(models.RealizationDocumentItem.product),
            )
            .filter(models.RealizationDocument.id == operation_id)
            .first()
        )
        if not row:
            raise HTTPException(status_code=404, detail="Операция не найдена")
        payload = {
            "client_name": row.client_name,
            "client_phone": row.client_phone,
            "bath_name": row.bath.name if row.bath else None,
            "reservation_id": row.reservation_id,
            "is_reversal": bool((row.total_amount or 0) < 0),
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else None,
                    "quantity": item.quantity,
                    "price": float(item.price or 0),
                }
                for item in row.items
            ],
        }
        return schemas.FinanceOperationDetailOut(
            source="realization",
            operation_type="expense" if (row.total_amount or 0) < 0 else "income",
            id=row.id,
            date=row.date,
            amount=abs(float(row.total_amount or 0)),
            account_id=row.account_id,
            payload=payload,
        )

    raise HTTPException(status_code=400, detail="source должен быть entrance или realization")
