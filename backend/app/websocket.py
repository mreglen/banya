from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

from app.database import SessionLocal
from app import models


class ConnectionManager:
    """Менеджер WebSocket подключений для чата поддержки"""
    
    def __init__(self):
        # Активные подключения: {ticket_id: [WebSocket, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, ticket_id: int):
        """Подключить клиента к чату"""
        await websocket.accept()
        
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = []
        
        self.active_connections[ticket_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, ticket_id: int):
        """Отключить клиента от чата"""
        if ticket_id in self.active_connections:
            if websocket in self.active_connections[ticket_id]:
                self.active_connections[ticket_id].remove(websocket)
            
            # Если больше нет подключений к этому тикету, удаляем его
            if not self.active_connections[ticket_id]:
                del self.active_connections[ticket_id]
    
    async def send_to_ticket(self, ticket_id: int, message: dict):
        """Отправить сообщение всем подключенным клиентам конкретного тикета"""
        if ticket_id in self.active_connections:
            disconnected = []
            
            for connection in self.active_connections[ticket_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Если соединение разорвано, помечаем для удаления
                    disconnected.append(connection)
            
            # Удаляем разорванные соединения
            for conn in disconnected:
                self.disconnect(conn, ticket_id)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Отправить персональное сообщение"""
        await websocket.send_text(message)


# Глобальный экземпляр менеджера
manager = ConnectionManager()


async def websocket_endpoint(
    websocket: WebSocket,
    ticket_id: int,
    token: str = None
):
    """
    WebSocket эндпоинт для чата поддержки
    Подключение: /ws/support/{ticket_id}?token=YOUR_TOKEN
    """
    
    # Аутентификация через токен в query параметре
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return
    
    db = SessionLocal()
    try:
        # Получаем пользователя по токену
        from jose import jwt, JWTError
        from app.auth import SECRET_KEY, ALGORITHM, hash_token
        from app.models import UserSession
        
        # Декодируем токен
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                await websocket.close(code=4001, reason="Invalid token")
                return
        except JWTError:
            await websocket.close(code=4001, reason="Invalid token")
            return
        
        # Проверяем сессию
        token_hash = hash_token(token)
        session = db.query(UserSession).filter(
            UserSession.token_hash == token_hash,
            UserSession.is_active == True
        ).first()
        
        if not session:
            await websocket.close(code=4001, reason="Invalid session")
            return
        
        # Получаем пользователя
        user = db.query(models.User).filter(
            models.User.user_id == int(user_id)
        ).first()
        
        if not user or not user.is_active:
            await websocket.close(code=4001, reason="User not found or inactive")
            return
        
        # Проверяем доступ к тикету
        ticket = db.query(models.SupportTicket).filter(
            models.SupportTicket.id == ticket_id
        ).first()
        
        if not ticket:
            await websocket.close(code=4004, reason="Ticket not found")
            return
        
        # Пользователь может подключиться только к своему тикету
        # Админ может подключиться к любому тикету
        if not user.is_admin and ticket.user_id != user.user_id:
            await websocket.close(code=4003, reason="Access denied")
            return
        
        # Подключаем клиента
        await manager.connect(websocket, ticket_id)
        
        try:
            # Ждем сообщения от клиента
            while True:
                data = await websocket.receive_text()
                
                # Клиент может отправить сообщение
                try:
                    message_data = json.loads(data)
                    
                    if message_data.get("type") == "message":
                        message_text = message_data.get("message", "").strip()
                        
                        if not message_text:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Сообщение не может быть пустым"
                            })
                            continue
                        
                        # Проверяем статус тикета
                        if ticket.status == "closed":
                            await websocket.send_json({
                                "type": "error",
                                "message": "Нельзя писать в закрытое обращение"
                            })
                            continue
                        
                        # Для пользователей: проверяем, отвечал ли админ
                        if not user.is_admin:
                            admin_replied = db.query(models.SupportMessage).filter(
                                models.SupportMessage.ticket_id == ticket_id,
                                models.SupportMessage.is_from_admin == True
                            ).first()
                            
                            if not admin_replied:
                                await websocket.send_json({
                                    "type": "error",
                                    "message": "Дождитесь ответа администратора"
                                })
                                continue
                        
                        # Создаем сообщение в БД
                        from datetime import datetime, timezone
                        
                        message = models.SupportMessage(
                            ticket_id=ticket_id,
                            user_id=user.user_id,
                            message=message_text,
                            is_from_admin=user.is_admin
                        )
                        
                        db.add(message)
                        
                        # Обновляем время обращения
                        ticket.updated_at = datetime.now(timezone.utc)
                        db.commit()
                        db.refresh(message)
                        
                        # Формируем ответ
                        message_response = {
                            "type": "new_message",
                            "message": {
                                "id": message.id,
                                "ticket_id": message.ticket_id,
                                "user_id": message.user_id,
                                "message": message.message,
                                "is_from_admin": message.is_from_admin,
                                "created_at": message.created_at.isoformat(),
                                "user_full_name": user.full_name if not user.is_admin else "Администратор"
                            }
                        }
                        
                        # Отправляем всем подключенным клиентам
                        await manager.send_to_ticket(ticket_id, message_response)
                        
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, ticket_id)
            
    except Exception as e:
        try:
            await websocket.close(code=4000, reason=str(e))
        except:
            pass
    finally:
        db.close()
