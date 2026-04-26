from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Permission
from app.schemas import PermissionResponse
from pydantic import BaseModel

router = APIRouter(prefix="/admin/permissions/new", tags=["New Permissions"])


class PermissionCreate(BaseModel):
    code: str
    name: str
    category: str
    description: str = None


@router.get("/", response_model=List[PermissionResponse])
def get_all_permissions(db: Session = Depends(get_db)):
    """
    Получить все доступные права.
    """
    return db.query(Permission).all()


@router.get("/categories", response_model=List[str])
def get_permission_categories(db: Session = Depends(get_db)):
    """
    Получить список уникальных категорий прав.
    """
    categories = db.query(Permission.category).distinct().all()
    return [cat[0] for cat in categories]


@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(permission_data: PermissionCreate, db: Session = Depends(get_db)):
    """
    Создать новое право доступа.
    """
    # Проверка уникальности code
    existing = db.query(Permission).filter(Permission.code == permission_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Право с таким кодом уже существует"
        )
    
    db_permission = Permission(
        code=permission_data.code,
        name=permission_data.name,
        category=permission_data.category,
        description=permission_data.description
    )
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission
