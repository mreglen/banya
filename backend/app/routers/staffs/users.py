from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db, SessionLocal
from app.models import User, Role
from app.schemas import UserCreate, UserUpdate, UserResponse
from app.security import hash_password
from app.phone_utils import normalize_phone
from app.audit_logger import log_action, get_client_ip
from app.auth import get_current_user

router = APIRouter(prefix="/admin/company/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    # Исключаем администраторов из списка (is_admin=true)
    return db.query(User).options(
        joinedload(User.role_rel).joinedload(Role.permissions)
    ).filter(User.is_admin == False).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(
        joinedload(User.role_rel).joinedload(Role.permissions)
    ).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Нормализация телефона
    normalized_phone = normalize_phone(user_data.phone)
    if not normalized_phone:
        raise HTTPException(status_code=400, detail="Неверный формат телефона")
    
    # Проверка уникальности email
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Проверка уникальности телефона (используем нормализованный)
    if db.query(User).filter(User.phone == normalized_phone).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким телефоном уже существует")

    db_role = None
    if user_data.role_id is not None:
        db_role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not db_role:
            raise HTTPException(status_code=400, detail="Роль не найдена")

    # Хеширование пароля
    hashed_password = hash_password(user_data.password)

    # Создание пользователя
    db_user = User(
        email=user_data.email,
        phone=normalized_phone,  # Сохраняем нормализованный телефон
        password_hash=hashed_password,
        full_name=user_data.full_name,
        birth_date=user_data.birth_date,
        is_admin=user_data.is_admin,
        is_director=user_data.is_director,
        role_id=user_data.role_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Асинхронное логирование создания пользователя с детальной информацией
    summary = f"Создал сотрудника: {user_data.full_name} ({user_data.email})"
    
    from app.audit_logger import log_detailed_action
    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="user",
        entity_id=db_user.user_id,
        details={"email": user_data.email, "full_name": user_data.full_name},
        summary=summary,
        client_name=user_data.full_name,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )

    return db_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Если обновляется роль — проверить её существование
    if user_data.role_id is not None:
        db_role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not db_role:
            raise HTTPException(status_code=400, detail="Роль не найдена")
        db_user.role_id = user_data.role_id

    # Обновление полей
    update_data = user_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password" and value is not None:
            # Хешировать новый пароль
            setattr(db_user, "password_hash", hash_password(value))
        elif key == "phone" and value is not None:
            # Нормализовать телефон
            normalized = normalize_phone(value)
            if not normalized:
                raise HTTPException(status_code=400, detail="Неверный формат телефона")
            setattr(db_user, "phone", normalized)
        elif key != "password" and key != "role_id":
            setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    # Асинхронное логирование обновления пользователя с детальной информацией
    summary = f"Изменил сотрудника: {db_user.full_name} ({db_user.email})"
    
    from app.audit_logger import log_detailed_action
    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="user",
        entity_id=user_id,
        details={"email": db_user.email, "full_name": db_user.full_name},
        summary=summary,
        client_name=db_user.full_name,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )

    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Сохраняем информацию перед удалением для логирования
    user_email = db_user.email
    user_full_name = db_user.full_name
    
    db.delete(db_user)
    db.commit()

    # Асинхронное логирование удаления пользователя с детальной информацией
    summary = f"Удалил сотрудника: {user_full_name} ({user_email})"
    
    from app.audit_logger import log_detailed_action
    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="user",
        entity_id=user_id,
        details={"email": user_email, "full_name": user_full_name},
        summary=summary,
        client_name=user_full_name,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )

    return