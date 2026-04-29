# app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta, date
from typing import List, Dict, Any

from app import models, database

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/statistics")
def get_dashboard_statistics(db: Session = Depends(database.get_db)) -> Dict[str, Any]:
    """Получить статистику для дашборда"""
    
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)
    
    # Статистика бронирований
    reservations_today = db.query(models.Reservation).filter(
        func.date(models.Reservation.start_datetime) == today
    ).count()
    
    reservations_this_week = db.query(models.Reservation).filter(
        func.date(models.Reservation.start_datetime) >= start_of_week
    ).count()
    
    reservations_this_month = db.query(models.Reservation).filter(
        func.date(models.Reservation.start_datetime) >= start_of_month
    ).count()
    
    # Доход сегодня
    revenue_today = db.query(func.coalesce(func.sum(models.Reservation.total_cost), 0)).filter(
        func.date(models.Reservation.start_datetime) == today
    ).scalar()
    
    # Доход за неделю
    revenue_this_week = db.query(func.coalesce(func.sum(models.Reservation.total_cost), 0)).filter(
        func.date(models.Reservation.start_datetime) >= start_of_week
    ).scalar()
    
    # Доход за месяц
    revenue_this_month = db.query(func.coalesce(func.sum(models.Reservation.total_cost), 0)).filter(
        func.date(models.Reservation.start_datetime) >= start_of_month
    ).scalar()
    
    # Общее количество клиентов
    total_clients = db.query(models.Client).count()
    
    # Количество бань
    total_baths = db.query(models.Bath).count()
    
    # Заявки с сайта (непрочитанные)
    unread_bookings = db.query(models.Booking).filter(
        models.Booking.is_read == False
    ).count()
    
    # Всего заявок с сайта
    total_bookings = db.query(models.Booking).count()
    
    return {
        "reservations": {
            "today": reservations_today,
            "this_week": reservations_this_week,
            "this_month": reservations_this_month,
        },
        "revenue": {
            "today": revenue_today,
            "this_week": revenue_this_week,
            "this_month": revenue_this_month,
        },
        "clients": {
            "total": total_clients,
        },
        "baths": {
            "total": total_baths,
        },
        "bookings": {
            "unread": unread_bookings,
            "total": total_bookings,
        }
    }


@router.get("/revenue-chart")
def get_revenue_chart_data(days: int = 30, db: Session = Depends(database.get_db)) -> List[Dict[str, Any]]:
    """Получить данные для графика дохода за последние N дней"""
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Получаем доход по дням
    revenue_by_day = db.query(
        func.date(models.Reservation.start_datetime).label('date'),
        func.coalesce(func.sum(models.Reservation.total_cost), 0).label('revenue')
    ).filter(
        func.date(models.Reservation.start_datetime) >= start_date,
        func.date(models.Reservation.start_datetime) <= end_date
    ).group_by(
        func.date(models.Reservation.start_datetime)
    ).order_by(
        func.date(models.Reservation.start_datetime)
    ).all()
    
    # Преобразуем в dict для быстрого доступа
    revenue_dict = {str(row.date): row.revenue for row in revenue_by_day}
    
    # Создаем полный список дат (включая дни без дохода)
    chart_data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        chart_data.append({
            "date": current_date.strftime("%d.%m"),
            "revenue": revenue_dict.get(date_str, 0),
            "full_date": date_str
        })
        current_date += timedelta(days=1)
    
    return chart_data


@router.get("/reservations-chart")
def get_reservations_chart_data(days: int = 30, db: Session = Depends(database.get_db)) -> List[Dict[str, Any]]:
    """Получить данные для графика бронирований за последние N дней"""
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Получаем количество бронирований по дням
    reservations_by_day = db.query(
        func.date(models.Reservation.start_datetime).label('date'),
        func.count(models.Reservation.reservation_id).label('count')
    ).filter(
        func.date(models.Reservation.start_datetime) >= start_date,
        func.date(models.Reservation.start_datetime) <= end_date
    ).group_by(
        func.date(models.Reservation.start_datetime)
    ).order_by(
        func.date(models.Reservation.start_datetime)
    ).all()
    
    # Преобразуем в dict для быстрого доступа
    reservations_dict = {str(row.date): row.count for row in reservations_by_day}
    
    # Создаем полный список дат
    chart_data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        chart_data.append({
            "date": current_date.strftime("%d.%m"),
            "count": reservations_dict.get(date_str, 0),
            "full_date": date_str
        })
        current_date += timedelta(days=1)
    
    return chart_data


@router.get("/popular-baths")
def get_popular_baths(db: Session = Depends(database.get_db)) -> List[Dict[str, Any]]:
    """Получить самые популярные бани за последний месяц"""
    
    start_of_month = date.today().replace(day=1)
    
    # Получаем статистику по баням
    bath_stats = db.query(
        models.Bath.bath_id,
        models.Bath.name,
        func.count(models.Reservation.reservation_id).label('reservation_count'),
        func.coalesce(func.sum(models.Reservation.total_cost), 0).label('total_revenue')
    ).join(
        models.Reservation,
        models.Bath.bath_id == models.Reservation.bath_id
    ).filter(
        func.date(models.Reservation.start_datetime) >= start_of_month
    ).group_by(
        models.Bath.bath_id,
        models.Bath.name
    ).order_by(
        func.count(models.Reservation.reservation_id).desc()
    ).all()
    
    return [
        {
            "bath_id": stat.bath_id,
            "name": stat.name,
            "reservation_count": stat.reservation_count,
            "total_revenue": stat.total_revenue
        }
        for stat in bath_stats
    ]


@router.get("/recent-activity")
def get_recent_activity(limit: int = 10, db: Session = Depends(database.get_db)) -> List[Dict[str, Any]]:
    """Получить последнюю активность из audit logs"""
    
    activities = db.query(models.AuditLog).order_by(
        models.AuditLog.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for activity in activities:
        result.append({
            "id": activity.id,
            "action": activity.action,
            "entity_type": activity.entity_type,
            "summary": activity.summary,
            "client_name": activity.client_name,
            "bath_name": activity.bath_name,
            "created_at": activity.created_at.isoformat() if activity.created_at else None,
            "user_id": activity.user_id
        })
    
    return result
