from passlib.context import CryptContext
from fastapi import HTTPException, status
from functools import wraps


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def check_permission(user, required_permission_code: str):
    """Проверяет, есть ли у пользователя нужное право"""
    if not user:
        return False
    if required_permission_code and required_permission_code.startswith("administrator:"):
        return bool(getattr(user, "is_admin", False))

    if getattr(user, "is_admin", False) or getattr(user, "is_director", False):
        return True

    permissions = getattr(user, "permissions", None)
    if permissions is None and getattr(user, "role_rel", None):
        permissions = getattr(user.role_rel, "permissions", [])

    if not permissions:
        return False
    return any(p.code == required_permission_code for p in permissions)


def require_permission(permission_code: str):
    """Decorator для защиты эндпоинтов"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or not check_permission(current_user, permission_code):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Недостаточно прав"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator