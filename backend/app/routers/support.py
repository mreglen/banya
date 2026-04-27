from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
import os
import uuid
from pathlib import Path

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.websocket import manager

router = APIRouter(prefix="/support", tags=["Support"])

# Директория для загрузки файлов
SUPPORT_UPLOADS_DIR = Path("uploads/support")
SUPPORT_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def check_is_admin(user):
    """Проверка, что пользователь является администратором"""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для администраторов"
        )


@router.post("/tickets", response_model=schemas.SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: Request,
    title: str = Form(..., min_length=5, max_length=200),
    description: str = Form(..., min_length=10, max_length=5000),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Создать новое обращение в поддержку"""
    
    # Валидация количества файлов
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Максимум 5 фотографий"
        )
    
    # Валидация файлов
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Файл {file.filename} имеет недопустимый тип. Разрешены только изображения"
            )
        
        # Проверка размера файла
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Файл {file.filename} превышает максимальный размер 5 МБ"
            )
        await file.seek(0)  # Возвращаем позицию чтения в начало
    
    # Создание обращения
    ticket = models.SupportTicket(
        user_id=current_user.user_id,
        title=title,
        description=description,
        status="pending"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Загрузка файлов
    attachments = []
    for file in files:
        # Генерация уникального имени файла
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = SUPPORT_UPLOADS_DIR / unique_filename
        
        # Сохранение файла
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Создание записи в БД
        attachment = models.SupportTicketAttachment(
            ticket_id=ticket.id,
            file_path=f"/uploads/support/{unique_filename}"
        )
        db.add(attachment)
        attachments.append(attachment)
    
    db.commit()
    db.refresh(ticket)
    
    # Формирование ответа
    return schemas.SupportTicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        closed_at=ticket.closed_at,
        user_full_name=current_user.full_name,
        user_email=current_user.email,
        user_phone=current_user.phone,
        messages=[],
        attachments=[
            schemas.SupportTicketAttachmentResponse(
                id=a.id,
                ticket_id=a.ticket_id,
                file_path=a.file_path,
                created_at=a.created_at
            ) for a in attachments
        ],
        admin_has_replied=False
    )


@router.get("/tickets", response_model=List[schemas.SupportTicketListItem])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Получить свои обращения (для обычных пользователей)"""
    
    tickets = db.query(models.SupportTicket).filter(
        models.SupportTicket.user_id == current_user.user_id
    ).order_by(models.SupportTicket.created_at.desc()).all()
    
    result = []
    for ticket in tickets:
        # Подсчет сообщений
        message_count = db.query(models.SupportMessage).filter(
            models.SupportMessage.ticket_id == ticket.id
        ).count()
        
        # Последнее сообщение
        last_message = db.query(models.SupportMessage).filter(
            models.SupportMessage.ticket_id == ticket.id
        ).order_by(models.SupportMessage.created_at.desc()).first()
        
        result.append(schemas.SupportTicketListItem(
            id=ticket.id,
            user_id=ticket.user_id,
            title=ticket.title,
            status=ticket.status,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            user_full_name=current_user.full_name,
            user_email=current_user.email,
            message_count=message_count,
            last_message_at=last_message.created_at if last_message else None
        ))
    
    return result


@router.get("/tickets/{ticket_id}", response_model=schemas.SupportTicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Получить детали обращения"""
    
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Обращение не найдено"
        )
    
    # Проверка прав доступа
    if not current_user.is_admin and ticket.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )
    
    # Получение сообщений
    messages = db.query(models.SupportMessage).filter(
        models.SupportMessage.ticket_id == ticket_id
    ).order_by(models.SupportMessage.created_at.asc()).all()
    
    # Получение вложений
    attachments = db.query(models.SupportTicketAttachment).filter(
        models.SupportTicketAttachment.ticket_id == ticket_id
    ).all()
    
    # Проверка, отвечал ли админ
    admin_replied = db.query(models.SupportMessage).filter(
        models.SupportMessage.ticket_id == ticket_id,
        models.SupportMessage.is_from_admin == True
    ).first() is not None
    
    # Информация о пользователе
    ticket_user = db.query(models.User).filter(
        models.User.user_id == ticket.user_id
    ).first()
    
    return schemas.SupportTicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        closed_at=ticket.closed_at,
        user_full_name=ticket_user.full_name,
        user_email=ticket_user.email,
        user_phone=ticket_user.phone,
        messages=[
            schemas.SupportMessageResponse(
                id=msg.id,
                ticket_id=msg.ticket_id,
                user_id=msg.user_id,
                message=msg.message,
                is_from_admin=msg.is_from_admin,
                created_at=msg.created_at,
                user_full_name=ticket_user.full_name if msg.user_id == ticket.user_id else "Администратор"
            ) for msg in messages
        ],
        attachments=[
            schemas.SupportTicketAttachmentResponse(
                id=att.id,
                ticket_id=att.ticket_id,
                file_path=att.file_path,
                created_at=att.created_at
            ) for att in attachments
        ],
        admin_has_replied=admin_replied
    )


@router.get("/admin/tickets", response_model=List[schemas.SupportTicketListItem])
def get_all_tickets(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Получить все обращения (только для администраторов)"""
    check_is_admin(current_user)
    
    query = db.query(models.SupportTicket)
    
    if status_filter:
        query = query.filter(models.SupportTicket.status == status_filter)
    
    tickets = query.order_by(models.SupportTicket.created_at.desc()).all()
    
    result = []
    for ticket in tickets:
        # Информация о пользователе
        ticket_user = db.query(models.User).filter(
            models.User.user_id == ticket.user_id
        ).first()
        
        # Подсчет сообщений
        message_count = db.query(models.SupportMessage).filter(
            models.SupportMessage.ticket_id == ticket.id
        ).count()
        
        # Последнее сообщение
        last_message = db.query(models.SupportMessage).filter(
            models.SupportMessage.ticket_id == ticket.id
        ).order_by(models.SupportMessage.created_at.desc()).first()
        
        result.append(schemas.SupportTicketListItem(
            id=ticket.id,
            user_id=ticket.user_id,
            title=ticket.title,
            status=ticket.status,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            user_full_name=ticket_user.full_name if ticket_user else "Unknown",
            user_email=ticket_user.email if ticket_user else "",
            message_count=message_count,
            last_message_at=last_message.created_at if last_message else None
        ))
    
    return result


@router.patch("/admin/tickets/{ticket_id}/status", response_model=schemas.SupportTicketResponse)
def update_ticket_status(
    ticket_id: int,
    update_data: schemas.SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Изменить статус обращения (только для администраторов)"""
    check_is_admin(current_user)
    
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Обращение не найдено"
        )
    
    if update_data.status not in ["pending", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый статус. Допустимые значения: pending, closed"
        )
    
    ticket.status = update_data.status
    
    if update_data.status == "closed":
        ticket.closed_at = datetime.now(timezone.utc)
    elif update_data.status == "pending":
        ticket.closed_at = None
    
    db.commit()
    db.refresh(ticket)
    
    # Получение обновленных данных
    ticket_user = db.query(models.User).filter(
        models.User.user_id == ticket.user_id
    ).first()
    
    return schemas.SupportTicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        closed_at=ticket.closed_at,
        user_full_name=ticket_user.full_name,
        user_email=ticket_user.email,
        user_phone=ticket_user.phone,
        messages=[],
        attachments=[],
        admin_has_replied=False
    )


@router.post("/tickets/{ticket_id}/messages", response_model=schemas.SupportMessageResponse)
async def send_message(
    ticket_id: int,
    message_data: schemas.SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Отправить сообщение в обращении"""
    
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Обращение не найдено"
        )
    
    # Проверка прав доступа
    if not current_user.is_admin and ticket.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )
    
    # Проверка, закрыто ли обращение
    if ticket.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя писать в закрытое обращение"
        )
    
    # Для пользователей: проверка, отвечал ли админ
    if not current_user.is_admin:
        admin_replied = db.query(models.SupportMessage).filter(
            models.SupportMessage.ticket_id == ticket_id,
            models.SupportMessage.is_from_admin == True
        ).first()
        
        if not admin_replied:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дождитесь ответа администратора"
            )
    
    # Создание сообщения
    is_from_admin = current_user.is_admin
    
    message = models.SupportMessage(
        ticket_id=ticket_id,
        user_id=current_user.user_id,
        message=message_data.message,
        is_from_admin=is_from_admin
    )
    
    db.add(message)
    
    # Обновление времени обращения
    ticket.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(message)
    
    # Информация о пользователе
    user_full_name = current_user.full_name if not is_from_admin else "Администратор"
    
    # Отправка уведомления через WebSocket
    message_response = schemas.SupportMessageResponse(
        id=message.id,
        ticket_id=message.ticket_id,
        user_id=message.user_id,
        message=message.message,
        is_from_admin=message.is_from_admin,
        created_at=message.created_at,
        user_full_name=user_full_name
    )
    
    # Отправка всем подключенным клиентам
    await manager.send_to_ticket(
        ticket_id,
        {
            "type": "new_message",
            "message": message_response.dict()
        }
    )
    
    return message_response
