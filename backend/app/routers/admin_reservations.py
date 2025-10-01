from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
from app import models, schemas, database
from app.auth import get_current_user 


router = APIRouter(
    prefix="/admin/reservations",  
    tags=["reservations"]
)

def check_overlap(db: Session, bath_id: int, start: datetime, end: datetime, exclude_id: int = None):
    """
    Проверяет пересечение с существующими бронями, включая 30-минутную уборку после каждой.
    Уборка = end_datetime + 30 минут.
    """
    query = db.query(models.Reservation).filter(
        models.Reservation.bath_id == bath_id,
        # Проверяем пересечение с [start, end) НОВОЙ брони
        # и [real_start, real_end + 30min) СУЩЕСТВУЮЩЕЙ брони (включая уборку)
        models.Reservation.start_datetime < end,
        (models.Reservation.end_datetime + timedelta(minutes=30)) > start
    )
    if exclude_id:
        query = query.filter(models.Reservation.reservation_id != exclude_id)
    
    return query.first()

@router.get("/", response_model=List[schemas.ReservationResponse])
def get_reservations(
    date: str,
    bath_id: int = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # ✅ Улучшенный парсинг даты
        if "T" in date:
            target_date = datetime.fromisoformat(date.split('T')[0]).date()
        else:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())

    # Подгружаем связанные данные
    query = db.query(models.Reservation).filter(
        models.Reservation.start_datetime >= start_of_day,
        models.Reservation.end_datetime <= end_of_day
    ).options(
        joinedload(models.Reservation.reservation_brooms).joinedload(models.ReservationBroom.broom),
        joinedload(models.Reservation.reservation_menu_items).joinedload(models.ReservationMenuItem.menu_item),
        joinedload(models.Reservation.reservation_massages).joinedload(models.ReservationMassage.massage)
    )

    if bath_id is not None:
        query = query.filter(models.Reservation.bath_id == bath_id)

    reservations = query.all()

    # Формируем поля для ответа (как в get_reservation)
    for res in reservations:
        # Веники
        res.brooms = [
            schemas.ReservationBroomResponse(
                broom_id=rb.broom.id,
                name=rb.broom.name,
                price=rb.broom.price,
                quantity=rb.quantity
            )
            for rb in res.reservation_brooms
        ]
        
        # Блюда
        res.menu_items = [
            schemas.ReservationMenuItemResponse(
                menu_item_id=rmi.menu_item.id,
                name=rmi.menu_item.name,
                price=rmi.menu_item.price,
                quantity=rmi.quantity,
                category=schemas.MenuCategoryBase.from_orm(rmi.menu_item.category_rel)
            )
            for rmi in res.reservation_menu_items
        ]
        
        # Массажи
        res.massages = [
            schemas.ReservationMassageResponse(
                massage_id=rm.massage.massage_id,
                name=rm.massage.name,
                cost=rm.massage.cost,
                quantity=rm.quantity
            )
            for rm in res.reservation_massages
        ]

        # ✅ Статус — ОБЯЗАТЕЛЬНО!
        res.status = res.status_rel.status_name

    return reservations


@router.post("/", response_model=schemas.ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: schemas.ReservationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Проверяем, существует ли баня
    bath = db.query(models.Bath).filter(models.Bath.bath_id == reservation.bath_id).first()
    if not bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    # 2. Проверяем, существует ли статус
    status_obj = db.query(models.ReservationStatus).filter(models.ReservationStatus.id == reservation.status_id).first()
    if not status_obj:
        raise HTTPException(status_code=400, detail=f"Статус с ID {reservation.status_id} не найден")

    # 3. Парсим даты
    try:
        start_dt = datetime.fromisoformat(reservation.start_datetime)
        end_dt = datetime.fromisoformat(reservation.end_datetime)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте ISO: YYYY-MM-DDTHH:MM:SS")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Время окончания должно быть позже начала")

    # 4. Проверяем пересечения
    overlap = check_overlap(db, reservation.bath_id, start_dt, end_dt)
    if overlap:
        raise HTTPException(status_code=400, detail="Бронь пересекается с существующей")

    # 5. Рассчитываем общую стоимость
    total_cost = 0

    # 5.1 Стоимость бани + гости
    duration_hours = (end_dt - start_dt).total_seconds() / 3600
    bath_base_cost = int(bath.cost * duration_hours)
    extra_guests = max(0, reservation.guests - bath.base_guests)
    extra_guest_cost = extra_guests * bath.extra_guest_price
    total_cost += bath_base_cost + extra_guest_cost

    # 5.2 Стоимость веников
    if reservation.brooms:
        broom_ids = [b.broom_id for b in reservation.brooms]
        brooms = db.query(models.Broom).filter(models.Broom.id.in_(broom_ids)).all()
        broom_map = {b.id: b for b in brooms}
        for item in reservation.brooms:
            broom = broom_map.get(item.broom_id)
            if not broom:
                raise HTTPException(status_code=400, detail=f"Веник с ID {item.broom_id} не найден")
            total_cost += broom.price * item.quantity

    # 5.3 Стоимость блюд
    if reservation.menu_items:
        menu_item_ids = [m.menu_item_id for m in reservation.menu_items]
        menu_items = db.query(models.MenuItem).filter(models.MenuItem.id.in_(menu_item_ids)).all()
        menu_item_map = {m.id: m for m in menu_items}
        for item in reservation.menu_items:
            menu_item = menu_item_map.get(item.menu_item_id)
            if not menu_item:
                raise HTTPException(status_code=400, detail=f"Блюдо с ID {item.menu_item_id} не найдено")
            total_cost += menu_item.price * item.quantity

    # 5.4 Стоимость массажей
    if reservation.massages:
        massage_ids = [m.massage_id for m in reservation.massages]
        massages = db.query(models.Massage).filter(models.Massage.massage_id.in_(massage_ids)).all()
        massage_map = {m.massage_id: m for m in massages}
        for item in reservation.massages:
            massage = massage_map.get(item.massage_id)
            if not massage:
                raise HTTPException(status_code=400, detail=f"Массаж с ID {item.massage_id} не найден")
            total_cost += massage.cost * item.quantity

    # 6. Создаём бронь
    db_reservation = models.Reservation(
        bath_id=reservation.bath_id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        client_name=reservation.client_name,
        client_phone=reservation.client_phone,
        client_email=reservation.client_email,
        notes=reservation.notes,
        guests=reservation.guests,
        total_cost=total_cost,
        status_id=reservation.status_id,  # ✅
    )
    db.add(db_reservation)
    db.flush()

    # 7. Сохраняем связанные сущности
    for item in reservation.massages:
        db.add(models.ReservationMassage(
            reservation_id=db_reservation.reservation_id,
            massage_id=item.massage_id,
            quantity=item.quantity
        ))
    for item in reservation.brooms:
        db.add(models.ReservationBroom(
            reservation_id=db_reservation.reservation_id,
            broom_id=item.broom_id,
            quantity=item.quantity
        ))
    for item in reservation.menu_items:
        db.add(models.ReservationMenuItem(
            reservation_id=db_reservation.reservation_id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity
        ))

    db.commit()
    db.refresh(db_reservation)

    # 8. Подгружаем связанные данные для ответа
    db_reservation.brooms = [
        schemas.ReservationBroomResponse(
            broom_id=rb.broom.id,
            name=rb.broom.name,
            price=rb.broom.price,
            quantity=rb.quantity
        )
        for rb in db_reservation.reservation_brooms
    ]
    db_reservation.menu_items = [
        schemas.ReservationMenuItemResponse(
            menu_item_id=rmi.menu_item.id,
            name=rmi.menu_item.name,
            price=rmi.menu_item.price,
            quantity=rmi.quantity,
            category=schemas.MenuCategoryBase.from_orm(rmi.menu_item.category_rel)
        )
        for rmi in db_reservation.reservation_menu_items
    ]
    db_reservation.massages = [
        schemas.ReservationMassageResponse(
            massage_id=rm.massage.massage_id,
            name=rm.massage.name,
            cost=rm.massage.cost,
            quantity=rm.quantity
        )
        for rm in db_reservation.reservation_massages
    ]
    db_reservation.status = db_reservation.status_rel.status_name  # ✅ имя статуса

    return db_reservation

@router.get("/{id}", response_model=schemas.ReservationResponse)
def get_reservation(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = db.query(models.Reservation)\
        .options(
            joinedload(models.Reservation.reservation_brooms).joinedload(models.ReservationBroom.broom),
            joinedload(models.Reservation.reservation_menu_items).joinedload(models.ReservationMenuItem.menu_item),
            joinedload(models.Reservation.reservation_massages).joinedload(models.ReservationMassage.massage),
            joinedload(models.Reservation.status_rel)  # ✅ ДОБАВЬТЕ ЭТО ДЛЯ НАДЕЖНОСТИ
        )\
        .filter(models.Reservation.reservation_id == id)\
        .first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    # 👇 Преобразуем ORM-объекты в формат, который ожидает Pydantic
    reservation.brooms = [
        schemas.ReservationBroomResponse(
            broom_id=rb.broom.id,
            name=rb.broom.name,
            price=rb.broom.price,
            quantity=rb.quantity
        )
        for rb in reservation.reservation_brooms
    ]

    reservation.menu_items = [
        schemas.ReservationMenuItemResponse(
            menu_item_id=rmi.menu_item.id,
            name=rmi.menu_item.name,
            price=rmi.menu_item.price,
            quantity=rmi.quantity,
            category=schemas.MenuCategoryBase.from_orm(rmi.menu_item.category_rel)
        )
        for rmi in reservation.reservation_menu_items
    ]

    reservation.massages = [
        schemas.ReservationMassageResponse(
            massage_id=rm.massage.massage_id,
            name=rm.massage.name,
            cost=rm.massage.cost,
            quantity=rm.quantity
        )
        for rm in reservation.reservation_massages
    ]

    # ✅ ОБЯЗАТЕЛЬНО: добавляем поле status для Pydantic
    reservation.status = reservation.status_rel.status_name

    return reservation

@router.put("/{id}", response_model=schemas.ReservationResponse)
def update_reservation(
    id: int,
    reservation: schemas.ReservationUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_reservation = db.query(models.Reservation).filter(models.Reservation.reservation_id == id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    # Обновляем основные поля (кроме guests, status_id и дат — они обрабатываются отдельно)
    update_data = reservation.model_dump(
        exclude={"brooms", "menu_items", "massages", "guests", "status_id"},
        exclude_unset=True
    )
    for key, value in update_data.items():
        if value is not None:
            setattr(db_reservation, key, value)

    # Обработка guests
    current_guests = reservation.guests if reservation.guests is not None else db_reservation.guests
    db_reservation.guests = current_guests

    # Обработка status_id
    if reservation.status_id is not None:
        status_obj = db.query(models.ReservationStatus).filter(models.ReservationStatus.id == reservation.status_id).first()
        if not status_obj:
            raise HTTPException(status_code=400, detail=f"Статус с ID {reservation.status_id} не найден")
        db_reservation.status_id = reservation.status_id

    # Обработка дат
    start_dt = db_reservation.start_datetime
    end_dt = db_reservation.end_datetime

    if reservation.start_datetime:
        try:
            start_dt = datetime.fromisoformat(reservation.start_datetime)
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат даты начала")
    if reservation.end_datetime:
        try:
            end_dt = datetime.fromisoformat(reservation.end_datetime)
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат даты окончания")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Время окончания должно быть позже начала")

    # Проверка пересечений (исключая текущую бронь)
    overlap = check_overlap(db, db_reservation.bath_id, start_dt, end_dt, exclude_id=id)
    if overlap:
        raise HTTPException(status_code=400, detail="Бронь пересекается с существующей")

    db_reservation.start_datetime = start_dt
    db_reservation.end_datetime = end_dt

    # Пересчёт стоимости
    bath = db.query(models.Bath).filter(models.Bath.bath_id == db_reservation.bath_id).first()
    if not bath:
        raise HTTPException(status_code=500, detail="Баня, связанная с бронью, не найдена")

    duration_hours = (end_dt - start_dt).total_seconds() / 3600
    bath_base_cost = int(bath.cost * duration_hours)
    extra_guests = max(0, current_guests - bath.base_guests)
    extra_guest_cost = extra_guests * bath.extra_guest_price
    total_cost = bath_base_cost + extra_guest_cost

    # Стоимость веников
    if reservation.brooms:
        broom_ids = [b.broom_id for b in reservation.brooms]
        brooms = db.query(models.Broom).filter(models.Broom.id.in_(broom_ids)).all()
        broom_map = {b.id: b for b in brooms}
        for item in reservation.brooms:
            broom = broom_map.get(item.broom_id)
            if not broom:
                raise HTTPException(status_code=400, detail=f"Веник с ID {item.broom_id} не найден")
            total_cost += broom.price * item.quantity

    # Стоимость блюд
    if reservation.menu_items:
        menu_item_ids = [m.menu_item_id for m in reservation.menu_items]
        menu_items = db.query(models.MenuItem).filter(models.MenuItem.id.in_(menu_item_ids)).all()
        menu_item_map = {m.id: m for m in menu_items}
        for item in reservation.menu_items:
            menu_item = menu_item_map.get(item.menu_item_id)
            if not menu_item:
                raise HTTPException(status_code=400, detail=f"Блюдо с ID {item.menu_item_id} не найдено")
            total_cost += menu_item.price * item.quantity

    # Стоимость массажей
    if reservation.massages:
        massage_ids = [m.massage_id for m in reservation.massages]
        massages = db.query(models.Massage).filter(models.Massage.massage_id.in_(massage_ids)).all()
        massage_map = {m.massage_id: m for m in massages}
        for item in reservation.massages:
            massage = massage_map.get(item.massage_id)
            if not massage:
                raise HTTPException(status_code=400, detail=f"Массаж с ID {item.massage_id} не найден")
            total_cost += massage.cost * item.quantity

    db_reservation.total_cost = total_cost

   # Очищаем старые связи
    db.query(models.ReservationBroom).filter(models.ReservationBroom.reservation_id == id).delete()
    db.query(models.ReservationMenuItem).filter(models.ReservationMenuItem.reservation_id == id).delete()
    db.query(models.ReservationMassage).filter(models.ReservationMassage.reservation_id == id).delete()

    # Добавляем новые связи через ORM-объекты
    for item in reservation.brooms:
        db.add(models.ReservationBroom(
            reservation_id=id,
            broom_id=item.broom_id,
            quantity=item.quantity
        ))

    for item in reservation.massages:
        db.add(models.ReservationMassage(
            reservation_id=id,
            massage_id=item.massage_id,
            quantity=item.quantity
        ))

    for item in reservation.menu_items:
        db.add(models.ReservationMenuItem(
            reservation_id=id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity
        ))

    db.commit()
    db.refresh(db_reservation)

    # Подгружаем связанные данные для ответа
    db_reservation.brooms = [
        schemas.ReservationBroomResponse(
            broom_id=rb.broom.id,
            name=rb.broom.name,
            price=rb.broom.price,
            quantity=rb.quantity
        )
        for rb in db_reservation.reservation_brooms
    ]
    db_reservation.menu_items = [
        schemas.ReservationMenuItemResponse(
            menu_item_id=rmi.menu_item.id,
            name=rmi.menu_item.name,
            price=rmi.menu_item.price,
            quantity=rmi.quantity,
            category=schemas.MenuCategoryBase.from_orm(rmi.menu_item.category_rel)
        )
        for rmi in db_reservation.reservation_menu_items
    ]
    db_reservation.massages = [
        schemas.ReservationMassageResponse(
            massage_id=rm.massage.massage_id,
            name=rm.massage.name,
            cost=rm.massage.cost,
            quantity=rm.quantity
        )
        for rm in db_reservation.reservation_massages
    ]
    db_reservation.status = db_reservation.status_rel.status_name 

    return db_reservation


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = db.query(models.Reservation).filter(models.Reservation.reservation_id == id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    db.delete(reservation)
    db.commit()
    return None