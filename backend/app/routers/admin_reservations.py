from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta, date
from app import models, schemas, database
from app.auth import get_current_user
from app.email_service import send_booking_confirmation_email
from app.audit_logger import log_action, get_client_ip
from app.database import SessionLocal


router = APIRouter(
    prefix="/admin/reservations",
    tags=["reservations"]
)


def _send_booking_confirmation_email_task(
    email: str,
    client_name: str,
    bath_name: str,
    start_datetime: datetime,
    end_datetime: datetime,
    guests: int,
    total_cost: float,
    products: Optional[List[dict]] = None,
    notes: Optional[str] = None,
) -> None:
    try:
        send_booking_confirmation_email(
            email=email,
            client_name=client_name,
            bath_name=bath_name,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            guests=guests,
            total_cost=total_cost,
            products=products,
            notes=notes,
        )
    except Exception as e:
        print(f"Ошибка фоновой отправки email подтверждения брони: {e}")


def _is_closed_status(db: Session, status_id: int) -> bool:
    status_obj = db.query(models.ReservationStatus).filter(models.ReservationStatus.id == status_id).first()
    return bool(
        status_obj
        and isinstance(status_obj.status_name, str)
        and status_obj.status_name.strip().lower() == "закрыт"
    )


def _resolve_sale_price(item, product) -> float:
    """Цена продажи в брони: из запроса/записи, иначе текущая цена товара."""
    if item is not None and getattr(item, "price", None) is not None:
        return float(item.price)
    if item is not None and getattr(item, "sale_price", None) is not None:
        return float(item.sale_price)
    return float(product.price or 0)


def _reservation_product_response(rp) -> schemas.ReservationProductResponse:
    product = rp.product
    return schemas.ReservationProductResponse(
        product_id=product.id,
        name=product.name,
        quantity=rp.quantity,
        price=_resolve_sale_price(rp, product),
        unit_id=product.unit_id,
    )


def check_overlap(db: Session, bath_id: int, start: datetime, end: datetime, exclude_id: int = None):
    """
    Проверяет пересечение с существующими бронями, включая время на уборку после каждой.
    Время уборки берется из настроек (по умолчанию 30 минут).
    Использует FOR UPDATE для предотвращения race condition.
    """
    # Получаем время уборки из настроек
    cleaning_setting = db.query(models.Settings).filter(models.Settings.key == "cleaning_time_minutes").first()
    cleaning_minutes = cleaning_setting.value if cleaning_setting else 30
    
    query = db.query(models.Reservation).filter(
        models.Reservation.bath_id == bath_id,
        models.Reservation.start_datetime < end,
        (models.Reservation.end_datetime + timedelta(minutes=cleaning_minutes)) > start
    ).with_for_update(skip_locked=True)  # Блокировка для предотвращения race condition
    
    if exclude_id:
        query = query.filter(models.Reservation.reservation_id != exclude_id)
    return query.first()


@router.get("/", response_model=List[schemas.ReservationResponse])
def get_reservations(
    date: str = None, 
    bath_id: int = None,
    status: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Reservation).options(
        joinedload(models.Reservation.status_rel),
        joinedload(models.Reservation.reservation_products).joinedload(models.ReservationProduct.product)
    )

    if date is not None:
        try:
            if "T" in date:
                target_date = datetime.fromisoformat(date.split('T')[0]).date()
            else:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())

        # Используем логику пересечения: бронь пересекается с днем, если
        # она начинается ДО конца дня и заканчивается ПОСЛЕ начала дня
        query = query.filter(
            models.Reservation.start_datetime < end_of_day,
            models.Reservation.end_datetime > start_of_day
        )

    if bath_id is not None:
        query = query.filter(models.Reservation.bath_id == bath_id)
    
    if status is not None:
        query = query.join(models.ReservationStatus).filter(models.ReservationStatus.status_name == status)

    reservations = query.all()

    for res in reservations:
        # Товары — только если объект существует
        res.products = [
            _reservation_product_response(rp)
            for rp in res.reservation_products
            if rp.product is not None
        ]
        
        # Статус
        res.status = res.status_rel.status_name if res.status_rel else "Неизвестный"

    return reservations


@router.post("/", response_model=schemas.ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: schemas.ReservationCreate,
    background_tasks: BackgroundTasks,
    request: Request,
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
    min_booking_hours = max(1, int(getattr(bath, "min_booking_hours", 1) or 1))
    if duration_hours < min_booking_hours:
        raise HTTPException(
            status_code=400,
            detail=f"Минимальная длительность брони для бани \"{bath.name}\" — {min_booking_hours} ч."
        )
    # Определяем день недели для начала бронирования (0=понедельник, 6=воскресенье)
    weekday = start_dt.weekday()
    # пн=0, вт=1, ср=2, чт=3 → будни; пт=4, сб=5, вс=6 → выходные
    hourly_rate = bath.cost_weekend if weekday >= 4 else bath.cost_weekday
    bath_base_cost = int(hourly_rate * duration_hours)
    extra_guests = max(0, reservation.guests - bath.base_guests)
    extra_guest_cost = extra_guests * bath.extra_guest_price
    total_cost += bath_base_cost + extra_guest_cost

    # 5.2 Стоимость товаров
    if reservation.products:
        product_ids = [p.product_id for p in reservation.products]
        products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
        product_map = {p.id: p for p in products}
        for item in reservation.products:
            product = product_map.get(item.product_id)
            if not product:
                raise HTTPException(status_code=400, detail=f"Товар с ID {item.product_id} не найден")
            if product.is_countable and product.total_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Недостаточно товара {product.name} на складе")
            total_cost += _resolve_sale_price(item, product) * item.quantity

    prepayment = reservation.prepayment or 0
    if prepayment < 0:
        raise HTTPException(status_code=400, detail="Предоплата не может быть отрицательной")
    if total_cost > 0 and prepayment > total_cost:
        raise HTTPException(status_code=400, detail="Предоплата не может превышать сумму брони")

    # 6. Создаём бронь
    db_reservation = models.Reservation(
        bath_id=reservation.bath_id,
        start_datetime=start_dt,
        end_datetime=end_dt,
        client_name=reservation.client_name,
        client_phone=reservation.client_phone,
        client_email=reservation.client_email,
        prepayment=prepayment,
        notes=reservation.notes,
        guests=reservation.guests,
        total_cost=total_cost,
        status_id=reservation.status_id,
        income_account_id=reservation.income_account_id,
    )
    db.add(db_reservation)
    db.flush()

    if _is_closed_status(db, reservation.status_id):
        realization_doc = models.RealizationDocument(
            date=date.today(),
            reservation_id=db_reservation.reservation_id,
            bath_id=db_reservation.bath_id,
            client_name=db_reservation.client_name,
            client_phone=db_reservation.client_phone,
            total_amount=db_reservation.total_cost,
            account_id=reservation.income_account_id,
        )
        db.add(realization_doc)
        db.flush()
        if reservation.products:
            for item in reservation.products:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    db.add(models.RealizationDocumentItem(
                        document_id=realization_doc.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        price=_resolve_sale_price(item, product)
                    ))

    # 7. Сохраняем товары и списываем со склада (резервирование)
    if reservation.products:
        for item in reservation.products:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Товар с ID {item.product_id} не найден")
            if product.is_countable:
                if product.total_quantity < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Недостаточно товара {product.name} на складе")
                product.total_quantity -= item.quantity
            db.add(models.ReservationProduct(
                reservation_id=db_reservation.reservation_id,
                product_id=item.product_id,
                quantity=item.quantity,
                sale_price=_resolve_sale_price(item, product),
            ))

    db.commit()
    db.refresh(db_reservation)

    # === ФОРМИРУЕМ ОТВЕТ ВРУЧНУЮ ===
    response_products = []
    if reservation.products:
        for item in reservation.products:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                response_products.append(
                    schemas.ReservationProductResponse(
                        product_id=product.id,
                        name=product.name,
                        quantity=item.quantity,
                        price=_resolve_sale_price(item, product),
                        unit_id=product.unit_id
                    )
                )

    # === EMAIL ПОДТВЕРЖДЕНИЯ (фон, не блокирует HTTP-ответ) ===
    if reservation.client_email:
        products_for_email = []
        if reservation.products:
            for item in reservation.products:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    products_for_email.append({
                        'name': product.name,
                        'quantity': item.quantity,
                        'price': _resolve_sale_price(item, product)
                    })
        background_tasks.add_task(
            _send_booking_confirmation_email_task,
            reservation.client_email,
            reservation.client_name,
            bath.name,
            start_dt,
            end_dt,
            reservation.guests,
            total_cost,
            products_for_email or None,
            reservation.notes,
        )

    # Асинхронное логирование создания бронирования с детальной информацией
    # Получить название бани
    bath = db.query(models.Bath).filter(models.Bath.bath_id == db_reservation.bath_id).first()
    
    # Сформировать список товаров
    product_names = []
    if reservation.products:
        for item in reservation.products:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product_names.append(f"{product.name} x{item.quantity}")
    
    product_list_str = ", ".join(product_names) if product_names else None
    
    # Человеко-читаемое описание
    start_dt = db_reservation.start_datetime
    summary = f"Создал бронь на {start_dt.strftime('%d.%m.%Y %H:%M')}, баня: {bath.name if bath else 'Не указано'}, клиент: {reservation.client_name}"
    if product_list_str:
        summary += f", товары: {product_list_str}"
    
    from app.audit_logger import log_detailed_action
    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="reservation",
        entity_id=db_reservation.reservation_id,
        details={"client_name": reservation.client_name, "bath_id": reservation.bath_id},
        summary=summary,
        bath_name=bath.name if bath else None,
        client_name=reservation.client_name,
        event_datetime=start_dt,
        product_list=product_list_str,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )

    return schemas.ReservationResponse(
        reservation_id=db_reservation.reservation_id,
        bath_id=db_reservation.bath_id,
        start_datetime=db_reservation.start_datetime,
        end_datetime=db_reservation.end_datetime,
        client_name=db_reservation.client_name,
        client_phone=db_reservation.client_phone,
        client_email=db_reservation.client_email,
        prepayment=db_reservation.prepayment or 0,
        notes=db_reservation.notes,
        guests=db_reservation.guests,
        total_cost=db_reservation.total_cost,
        status=status_obj.status_name,
        status_id=db_reservation.status_id,
        income_account_id=db_reservation.income_account_id,
        products=response_products,
        # Поле `massages` отсутствует в схеме ReservationResponse (см. schemas.py)
    )


@router.get("/{id}", response_model=schemas.ReservationResponse)
def get_reservation(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = db.query(models.Reservation)\
        .options(
            joinedload(models.Reservation.status_rel),
            joinedload(models.Reservation.reservation_products).joinedload(models.ReservationProduct.product)
        )\
        .filter(models.Reservation.reservation_id == id)\
        .first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    reservation.products = [
        _reservation_product_response(rp)
        for rp in reservation.reservation_products
        if rp.product is not None
    ]
    reservation.status = reservation.status_rel.status_name

    return reservation


@router.put("/{id}", response_model=schemas.ReservationResponse)
def update_reservation(
    id: int,
    reservation: schemas.ReservationUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Debug logging
    print(f"\n=== UPDATE RESERVATION REQUEST ===")
    print(f"Reservation ID: {id}")
    print(f"Update data: {reservation.model_dump(exclude_unset=True)}")
    print(f"==================================\n")
    
    try:
        db_reservation = db.query(models.Reservation).filter(models.Reservation.reservation_id == id).first()
        if not db_reservation:
            print(f"❌ Reservation {id} not found")
            raise HTTPException(status_code=404, detail="Бронь не найдена")
        
        print(f"✅ Found reservation: {db_reservation.client_name}")

        # Сохраняем старые значения для сравнения
        old_status_id = db_reservation.status_id
        old_bath_id = db_reservation.bath_id
        old_start_datetime = db_reservation.start_datetime
        old_end_datetime = db_reservation.end_datetime
        old_total_cost = float(db_reservation.total_cost or 0)
        old_income_account_id = db_reservation.income_account_id
        print(f"Old values: status={old_status_id}, bath={old_bath_id}")
        old_status_obj = db.query(models.ReservationStatus).filter(
            models.ReservationStatus.id == old_status_id
        ).first()
        old_status_name = old_status_obj.status_name if old_status_obj else None

        # Обновляем основные поля (только те, что переданы)
        update_data = reservation.model_dump(exclude_unset=True)
        
        # Обновляем простые поля
        for key, value in update_data.items():
            if key not in ['guests', 'status_id', 'products', 'start_datetime', 'end_datetime', 'income_account_id']:
                if value is not None:
                    setattr(db_reservation, key, value)
                    print(f"Updated {key} = {value}")

        # Обработка guests - используем переданное или оставляем текущее
        if reservation.guests is not None:
            db_reservation.guests = reservation.guests
            print(f"Updated guests = {reservation.guests}")
        current_guests = db_reservation.guests

        # Обработка status_id
        status_obj = None
        if reservation.status_id is not None:
            status_obj = db.query(models.ReservationStatus).filter(models.ReservationStatus.id == reservation.status_id).first()
            if not status_obj:
                print(f"❌ Status {reservation.status_id} not found")
                raise HTTPException(status_code=400, detail=f"Статус с ID {reservation.status_id} не найден")

            # Проверяем откат из статуса "закрыт": разрешено только админам и директорам
            if reservation.status_id != old_status_id:
                if old_status_name == "закрыт":
                    if not (current_user.is_admin or current_user.is_director):
                        print(f"❌ User {current_user.user_id} cannot revert closed reservation {id}")
                        raise HTTPException(
                            status_code=403,
                            detail="Только администратор или директор может вернуть закрытую бронь в работу"
                        )
                    # Финансовая компенсация: при выводе из "закрыт" создаем расход
                    # на сумму закрытия, чтобы оборот в финансах не дублировался.
                    # Используем отрицательную сумму в realization_document; на витрине
                    # финансов такие записи отображаются как "расход".
                    if old_income_account_id and old_total_cost > 0:
                        reversal_doc = models.RealizationDocument(
                            date=date.today(),
                            reservation_id=id,
                            bath_id=old_bath_id,
                            client_name=db_reservation.client_name,
                            client_phone=db_reservation.client_phone,
                            total_amount=-abs(old_total_cost),
                            account_id=old_income_account_id,
                        )
                        db.add(reversal_doc)
                        print("✅ Added reversal realization document for closed-status revert")

            db_reservation.status_id = reservation.status_id
            print(f"Updated status_id = {reservation.status_id}")

        # Проверяем, изменился ли статус на "закрыт"
        new_status_id = reservation.status_id if reservation.status_id is not None else old_status_id
        
        # Если статус изменен на "закрыт" (проверяем по названию)
        if _is_closed_status(db, new_status_id) and old_status_id != new_status_id:
            # Получаем товары из брони
            reservation_products = db.query(models.ReservationProduct).filter(
                models.ReservationProduct.reservation_id == id
            ).all()
            
            # Создаем документ реализации (без повторного списания!)
            # Товары уже были списаны при создании/редактировании брони
            realization_doc = models.RealizationDocument(
                date=date.today(),
                reservation_id=id,
                bath_id=db_reservation.bath_id,
                client_name=db_reservation.client_name,
                client_phone=db_reservation.client_phone,
                total_amount=db_reservation.total_cost,
                account_id=db_reservation.income_account_id,
            )
            db.add(realization_doc)
            db.flush()  # Получаем ID документа
            
            # Добавляем строки документа
            for rp in reservation_products:
                product = db.query(models.Product).filter(
                    models.Product.id == rp.product_id
                ).first()
                if product:
                    doc_item = models.RealizationDocumentItem(
                        document_id=realization_doc.id,
                        product_id=rp.product_id,
                        quantity=rp.quantity,
                        price=_resolve_sale_price(rp, product)
                    )
                    db.add(doc_item)

        # Обработка дат - используем текущие значения если не переданы новые
        start_dt = db_reservation.start_datetime
        end_dt = db_reservation.end_datetime
        print(f"\nProcessing dates...")
        print(f"Current start_dt: {start_dt}, end_dt: {end_dt}")

        if reservation.start_datetime:
            try:
                start_dt = datetime.fromisoformat(reservation.start_datetime)
                print(f"New start_dt: {start_dt}")
            except ValueError:
                print(f"❌ Invalid start_datetime format: {reservation.start_datetime}")
                raise HTTPException(status_code=400, detail="Неверный формат даты начала")
        if reservation.end_datetime:
            try:
                end_dt = datetime.fromisoformat(reservation.end_datetime)
                print(f"New end_dt: {end_dt}")
            except ValueError:
                print(f"❌ Invalid end_datetime format: {reservation.end_datetime}")
                raise HTTPException(status_code=400, detail="Неверный формат даты окончания")

        # Проверяем даты только если они были изменены или это не обновление статуса
        if reservation.start_datetime or reservation.end_datetime or not reservation.status_id:
            print(f"Validating dates: {start_dt} < {end_dt}")
            if start_dt >= end_dt:
                print(f"❌ End time must be after start time")
                raise HTTPException(status_code=400, detail="Время окончания должно быть позже начала")

            # Проверка пересечений только если изменились даты или баня
            if (reservation.start_datetime or reservation.end_datetime or reservation.bath_id):
                print(f"Checking for overlaps...")
                overlap = check_overlap(db, db_reservation.bath_id, start_dt, end_dt, exclude_id=id)
                if overlap:
                    print(f"❌ Overlap detected with reservation {overlap.reservation_id}")
                    raise HTTPException(status_code=400, detail="Бронь пересекается с существующей")
                print(f"✅ No overlaps found")

            db_reservation.start_datetime = start_dt
            db_reservation.end_datetime = end_dt
            print(f"Updated dates successfully")

            # Пересчёт стоимости только если изменились даты, гости или товары
            if reservation.start_datetime or reservation.end_datetime or reservation.guests or reservation.products:
                print(f"\nRecalculating cost...")
                bath = db.query(models.Bath).filter(models.Bath.bath_id == db_reservation.bath_id).first()
                if not bath:
                    print(f"❌ Bath {db_reservation.bath_id} not found")
                    raise HTTPException(status_code=500, detail="Баня, связанная с бронью, не найдена")

                duration_hours = (end_dt - start_dt).total_seconds() / 3600
                min_booking_hours = max(1, int(getattr(bath, "min_booking_hours", 1) or 1))
                if duration_hours < min_booking_hours:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Минимальная длительность брони для бани \"{bath.name}\" — {min_booking_hours} ч."
                    )
                print(f"Duration: {duration_hours} hours")
                # Определяем день недели для начала бронирования (0=понедельник, 6=воскресенье)
                weekday = start_dt.weekday()
                print(f"Weekday: {weekday} (0=Mon, 6=Sun)")
                # пн=0, вт=1, ср=2, чт=3 → будни; пт=4, сб=5, вс=6 → выходные
                hourly_rate = bath.cost_weekend if weekday >= 4 else bath.cost_weekday
                bath_base_cost = int(hourly_rate * duration_hours)
                extra_guests = max(0, current_guests - bath.base_guests)
                extra_guest_cost = extra_guests * bath.extra_guest_price
                total_cost = bath_base_cost + extra_guest_cost
                print(f"Bath cost: {bath_base_cost}, Extra guests: {extra_guests} x {bath.extra_guest_price} = {extra_guest_cost}")
                print(f"Total before products: {total_cost}")

                # Стоимость товаров
                if reservation.products:
                    print(f"\nProcessing {len(reservation.products)} products...")
                    product_ids = [p.product_id for p in reservation.products]
                    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
                    product_map = {p.id: p for p in products}
                    for item in reservation.products:
                        product = product_map.get(item.product_id)
                        if not product:
                            print(f"❌ Product {item.product_id} not found")
                            raise HTTPException(status_code=400, detail=f"Товар с ID {item.product_id} не найден")
                        print(f"Product: {product.name}, Qty: {item.quantity}, Stock: {product.total_quantity}, Price: {_resolve_sale_price(item, product)}")
                        if product.is_countable and product.total_quantity < item.quantity:
                            print(f"❌ Insufficient stock for {product.name}")
                            raise HTTPException(status_code=400, detail=f"Недостаточно товара {product.name} на складе")
                        product_cost = _resolve_sale_price(item, product) * item.quantity
                        total_cost += product_cost
                        print(f"Added product cost: {product_cost}")

                db_reservation.total_cost = total_cost
                print(f"✅ Total cost: {total_cost}")

        # Обновляем товары только если они были переданы в запросе
        if reservation.products is not None:
            print(f"\nUpdating products...")
            # Удаляем старые связи (только товары)
            db.query(models.ReservationProduct).filter(models.ReservationProduct.reservation_id == id).delete()
            print(f"Deleted old products")

            # Добавляем новые связи (без списания!)
            for item in reservation.products:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if not product:
                    print(f"❌ Product {item.product_id} not found")
                    raise HTTPException(status_code=400, detail=f"Товар с ID {item.product_id} не найден")
                if product.is_countable and product.total_quantity < item.quantity:
                    print(f"❌ Insufficient stock for {product.name}: {product.total_quantity} < {item.quantity}")
                    raise HTTPException(status_code=400, detail=f"Недостаточно товара {product.name} на складе")
                db.add(models.ReservationProduct(
                    reservation_id=id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    sale_price=_resolve_sale_price(item, product),
                ))
                print(f"Added product: {product.name} x {item.quantity}")
            print(f"✅ Products updated successfully")

        current_prepayment = db_reservation.prepayment or 0
        if current_prepayment < 0:
            raise HTTPException(status_code=400, detail="Предоплата не может быть отрицательной")
        if db_reservation.total_cost > 0 and current_prepayment > db_reservation.total_cost:
            raise HTTPException(status_code=400, detail="Предоплата не может превышать сумму брони")

        print(f"\nCommitting to database...")
        db.commit()
        db.refresh(db_reservation)
        print(f"✅ Reservation {id} updated successfully\n")

        # === ФОРМИРУЕМ ОТВЕТ ВРУЧНУЮ ===
        # Всегда получаем актуальные товары из базы
        response_products = []
        for rp in db_reservation.reservation_products:
            if rp.product:
                response_products.append(_reservation_product_response(rp))

        # === EMAIL ОБ ИЗМЕНЕНИИ (фон, не блокирует HTTP-ответ) ===
        if db_reservation.client_email and (reservation.start_datetime or reservation.end_datetime or
                                             reservation.guests or reservation.products or reservation.bath_id):
            bath_for_email = db.query(models.Bath).filter(models.Bath.bath_id == db_reservation.bath_id).first()
            products_for_email = []
            for rp in db_reservation.reservation_products:
                if rp.product:
                    products_for_email.append({
                        'name': rp.product.name,
                        'quantity': rp.quantity,
                        'price': _resolve_sale_price(rp, rp.product)
                    })
            background_tasks.add_task(
                _send_booking_confirmation_email_task,
                db_reservation.client_email,
                db_reservation.client_name,
                bath_for_email.name if bath_for_email else "Не указано",
                db_reservation.start_datetime,
                db_reservation.end_datetime,
                db_reservation.guests,
                db_reservation.total_cost,
                products_for_email or None,
                db_reservation.notes,
            )

        status_name = (status_obj or db.query(models.ReservationStatus)
                       .filter(models.ReservationStatus.id == db_reservation.status_id)
                       .first()).status_name

        # Асинхронное логирование обновления бронирования с детальной информацией
        bath = db.query(models.Bath).filter(models.Bath.bath_id == db_reservation.bath_id).first()
        
        # Сформировать список товаров
        product_names = []
        for rp in db_reservation.reservation_products:
            if rp.product:
                product_names.append(f"{rp.product.name} x{rp.quantity}")
        
        product_list_str = ", ".join(product_names) if product_names else None
        
        # Человеко-читаемое описание
        start_dt = db_reservation.start_datetime
        end_dt = db_reservation.end_datetime
        summary = f"Изменил бронь #{id} на {start_dt.strftime('%d.%m.%Y %H:%M')}-{end_dt.strftime('%H:%M')}, баня: {bath.name if bath else 'Не указано'}, клиент: {db_reservation.client_name}"
        if product_list_str:
            summary += f", товары: {product_list_str}"
        
        from app.audit_logger import log_detailed_action
        background_tasks.add_task(
            log_detailed_action,
            db=SessionLocal(),
            user_id=current_user.user_id,
            action="UPDATE",
            entity_type="reservation",
            entity_id=id,
            details={"client_name": db_reservation.client_name},
            summary=summary,
            bath_name=bath.name if bath else None,
            client_name=db_reservation.client_name,
            event_datetime=start_dt,
            product_list=product_list_str,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent")
        )

        return schemas.ReservationResponse(
            reservation_id=db_reservation.reservation_id,
            bath_id=db_reservation.bath_id,
            start_datetime=db_reservation.start_datetime,
            end_datetime=db_reservation.end_datetime,
            client_name=db_reservation.client_name,
            client_phone=db_reservation.client_phone,
            client_email=db_reservation.client_email,
            prepayment=db_reservation.prepayment or 0,
            notes=db_reservation.notes,
            guests=db_reservation.guests,
            total_cost=db_reservation.total_cost,
            status=status_name,
            status_id=db_reservation.status_id,
            income_account_id=db_reservation.income_account_id,
            products=response_products,
            # Поле `massages` отсутствует
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"\n❌ Unexpected error updating reservation {id}:")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    id: int,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = db.query(models.Reservation).filter(models.Reservation.reservation_id == id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    # === ВОЗВРАТ ТОВАРОВ НА СКЛАД ДО УДАЛЕНИЯ (только исчисляемые) ===
    for rp in reservation.reservation_products:
        product = db.query(models.Product).filter(models.Product.id == rp.product_id).first()
        if product and product.is_countable:
            product.total_quantity += rp.quantity

    # Теперь можно безопасно удалить
    db.delete(reservation)
    db.commit()

    # Асинхронное логирование удаления бронирования с детальной информацией
    bath = db.query(models.Bath).filter(models.Bath.bath_id == reservation.bath_id).first()
    
    # Человеко-читаемое описание
    start_dt = reservation.start_datetime
    end_dt = reservation.end_datetime
    summary = f"Удалил бронь #{id} на {start_dt.strftime('%d.%m.%Y %H:%M')}-{end_dt.strftime('%H:%M')}, баня: {bath.name if bath else 'Не указано'}, клиент: {reservation.client_name}"
    
    from app.audit_logger import log_detailed_action
    background_tasks.add_task(
        log_detailed_action,
        db=SessionLocal(),
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="reservation",
        entity_id=id,
        details={"client_name": reservation.client_name},
        summary=summary,
        bath_name=bath.name if bath else None,
        client_name=reservation.client_name,
        event_datetime=start_dt,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent")
    )

    return None