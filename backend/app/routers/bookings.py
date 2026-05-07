# app/routers/bookings.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app import models, schemas, database

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/availability")
def get_booking_availability(
    date: str,
    bath_id: int,
    days: int = 2,
    db: Session = Depends(database.get_db)
):
    try:
        start_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )

    if days < 1 or days > 3:
        raise HTTPException(status_code=400, detail="Параметр days должен быть от 1 до 3")

    end_date = start_date + timedelta(days=days)

    reservations = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.bath_id == bath_id,
            models.Reservation.start_datetime < end_date,
            models.Reservation.end_datetime > start_date,
        )
        .all()
    )

    return {
        "bath_id": bath_id,
        "date": date,
        "days": days,
        "occupied": [
            {
                "start_datetime": r.start_datetime.isoformat(),
                "end_datetime": r.end_datetime.isoformat(),
            }
            for r in reservations
        ],
    }

@router.post("/", response_model=schemas.BookingOut)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db)):
    try:
        booking_date = datetime.strptime(booking.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )

    bath = db.query(models.Bath).filter(models.Bath.bath_id == booking.bath_id).first()
    if not bath:
        raise HTTPException(status_code=404, detail="Баня не найдена")

    db_booking = models.Booking(
        bath_id=booking.bath_id,
        date=booking_date,
        duration_hours=booking.duration_hours,
        guests=booking.guests,
        name=booking.name,
        phone=booking.phone,
        email=booking.email,
        notes=booking.notes,
        is_read=False,
    )

    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    return {
        "booking_id": db_booking.booking_id,
        "bath_id": db_booking.bath_id,
        "date": db_booking.date.strftime("%Y-%m-%d"),
        "duration_hours": db_booking.duration_hours,
        "guests": db_booking.guests,
        "name": db_booking.name,
        "phone": db_booking.phone,
        "email": db_booking.email,
        "notes": db_booking.notes,
        "is_read": db_booking.is_read,
        "created_at": db_booking.created_at.isoformat(),
        "bath": {
            "bath_id": bath.bath_id,
            "slug": bath.slug,
            "name": bath.name,
            "title": bath.title,
            "cost_weekday": bath.cost_weekday,
            "cost_weekend": bath.cost_weekend,
            "min_booking_hours": getattr(bath, "min_booking_hours", 1) or 1,
            "description": bath.description,
            "base_guests": bath.base_guests,
            "extra_guest_price": bath.extra_guest_price,
            "photos": [],
            "promotions": [],
        }
    }

@router.get("/", response_model=List[schemas.BookingOut])
def get_all_bookings(db: Session = Depends(database.get_db)):
    bookings = db.query(models.Booking).order_by(models.Booking.created_at.desc()).all()
    
    result = []
    for booking in bookings:
        booking_data = {
            "booking_id": booking.booking_id,
            "bath_id": booking.bath_id,
            "date": booking.date.strftime("%Y-%m-%d"),
            "duration_hours": booking.duration_hours,
            "guests": booking.guests,
            "name": booking.name,
            "phone": booking.phone,
            "email": booking.email,
            "notes": booking.notes,
            "is_read": booking.is_read,
            "created_at": booking.created_at.isoformat(),
            "bath": {
                "bath_id": booking.bath.bath_id,
                "slug": booking.bath.slug,
                "name": booking.bath.name,
                "title": booking.bath.title,
                "cost_weekday": booking.bath.cost_weekday,
                "cost_weekend": booking.bath.cost_weekend,
                "min_booking_hours": getattr(booking.bath, "min_booking_hours", 1) or 1,
                "description": booking.bath.description,
                "base_guests": booking.bath.base_guests,
                "extra_guest_price": booking.bath.extra_guest_price,
                "photos": [],
                "promotions": [],
            } if booking.bath else None,
        }
        result.append(booking_data)
    return result


@router.put("/{booking_id}/mark-read", status_code=status.HTTP_200_OK)
def mark_booking_as_read(booking_id: int, db: Session = Depends(database.get_db)):
    booking = db.query(models.Booking).filter(models.Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if not booking.is_read:
        booking.is_read = True
        db.commit()

    return {"booking_id": booking.booking_id, "is_read": booking.is_read}