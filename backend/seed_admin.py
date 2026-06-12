"""Seed permissions and admin user. Run from backend/: python seed_admin.py"""
from app.database import SessionLocal
from app.models import User, Permission
from app.security import hash_password
from app.phone_utils import normalize_phone

PERMISSIONS = [
    ("reservations:view", "Просмотр бронирований", "reservations"),
    ("reservations:manage", "Управление бронированиями", "reservations"),
    ("bookings:view", "Просмотр заявок с сайта", "bookings"),
    ("bookings:manage", "Управление заявками", "bookings"),
    ("baths:view", "Просмотр бань", "baths"),
    ("baths:manage", "Управление банями", "baths"),
    ("storage:view", "Просмотр склада", "storage"),
    ("storage:manage", "Управление складом", "storage"),
    ("clients:view", "Просмотр клиентов", "clients"),
    ("clients:manage", "Управление клиентами", "clients"),
    ("partners:view", "Просмотр партнёров", "partners"),
    ("partners:manage", "Управление партнёрами", "partners"),
    ("staff:view", "Просмотр сотрудников", "staff"),
    ("staff:manage", "Управление сотрудниками", "staff"),
    ("documents:view", "Просмотр документов", "documents"),
    ("documents:manage", "Управление документами", "documents"),
    ("promotions:view", "Просмотр акций", "promotions"),
    ("promotions:manage", "Управление акциями", "promotions"),
    ("finance:view", "Просмотр финансов", "finance"),
    ("finance:manage", "Управление финансами", "finance"),
    ("administrator:audit", "Журнал аудита", "administrator"),
    ("administrator:roles", "Управление ролями", "administrator"),
]

ADMIN_EMAIL = "khram4uk@yandex.ru"
ADMIN_PHONE = "89959356025"
ADMIN_PASSWORD = "Vfcnth1!"
ADMIN_NAME = "Администратор"


def main() -> None:
    db = SessionLocal()
    try:
        created_perms = 0
        for code, name, category in PERMISSIONS:
            if not db.query(Permission).filter(Permission.code == code).first():
                db.add(Permission(code=code, name=name, category=category))
                created_perms += 1
        db.commit()
        total_perms = db.query(Permission).count()
        print(f"Permissions: {total_perms} total, {created_perms} new")

        phone = normalize_phone(ADMIN_PHONE)
        if not phone:
            raise ValueError(f"Invalid phone: {ADMIN_PHONE}")

        user = db.query(User).filter(
            (User.email == ADMIN_EMAIL) | (User.phone == phone)
        ).first()

        if user:
            user.email = ADMIN_EMAIL
            user.phone = phone
            user.password_hash = hash_password(ADMIN_PASSWORD)
            user.full_name = ADMIN_NAME
            user.is_admin = True
            user.is_director = False
            user.role_id = None
            user.is_active = True
            print(f"Admin updated: user_id={user.user_id}, phone={phone}")
        else:
            user = User(
                email=ADMIN_EMAIL,
                phone=phone,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name=ADMIN_NAME,
                is_admin=True,
                is_director=False,
                role_id=None,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Admin created: user_id={user.user_id}, phone={phone}")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
