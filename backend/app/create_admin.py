from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from security import hash_password


DATABASE_URL = "postgresql://postgres:root@localhost/baths_db" 

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_admin_user():
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже пользователь с таким именем
        existing = db.query(User).filter(User.username == "Илья").first()
        if existing:
            print("❌ Пользователь 'admin' уже существует.")
            return

        # Хэшируем пароль
        hashed_password = hash_password("admin123")  # ← Пароль: admin123

        # Создаём пользователя
        admin = User(
            username="admin",
            password_hash=hashed_password,
            role="admin",
            is_active=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"✅ Администратор 'admin' успешно добавлен! ID: {admin.user_id}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()