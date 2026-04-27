from datetime import datetime
from typing import Optional, Any, Dict
from fastapi import Request
from app.database import SessionLocal
from app.models import AuditLog


def get_client_ip(request: Request) -> str:
    """Получить IP адрес клиента"""
    return request.client.host if request.client else None


async def log_action(
    db,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Записать действие в журнал аудита.
    Использовать с BackgroundTasks для асинхронной записи без блокировки ответа.
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Логировать ошибку, но не прерывать основной поток
        print(f"Audit log error: {e}")
    finally:
        db.close()


async def log_detailed_action(
    db,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    summary: Optional[str] = None,
    bath_name: Optional[str] = None,
    client_name: Optional[str] = None,
    event_datetime: Optional[datetime] = None,
    product_list: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Создать расширенную запись аудита с человеко-читаемым описанием.
    Использовать с BackgroundTasks для асинхронной записи без блокировки ответа.
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            summary=summary,
            bath_name=bath_name,
            client_name=client_name,
            event_datetime=event_datetime,
            product_list=product_list,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Логировать ошибку, но не прерывать основной поток
        print(f"Audit log error: {e}")
    finally:
        db.close()
