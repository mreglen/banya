from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Date, CheckConstraint, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class Bath(Base):
    __tablename__ = "baths"

    bath_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False) 
    cost = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    base_guests = Column(Integer, nullable=False)        
    extra_guest_price = Column(Integer, nullable=False)

    photos = relationship("Photo", back_populates="bath", cascade="all, delete-orphan")
    features = relationship("BathFeature", back_populates="bath", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="bath", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="bath")






class Photo(Base):
    __tablename__ = "photos"

    photo_id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(500), nullable=False)

    bath_id = Column(Integer, ForeignKey("baths.bath_id", ondelete="CASCADE"), nullable=True)
    massage_id = Column(Integer, ForeignKey("massages.massage_id", ondelete="CASCADE"), nullable=True)

    bath = relationship("Bath", back_populates="photos")


class BathFeature(Base):
    __tablename__ = "bath_features"

    feature_id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), nullable=False)   
    value = Column(String(100), nullable=False)  
    bath_id = Column(Integer, ForeignKey("baths.bath_id", ondelete="CASCADE"), nullable=False)

    bath = relationship("Bath", back_populates="features")

# Бронирование
class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    bath_id = Column(Integer, ForeignKey("baths.bath_id"), nullable=False)
    date = Column(Date, nullable=False)  
    duration_hours = Column(Integer, nullable=False)
    guests = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bath = relationship("Bath", back_populates="bookings")

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)  
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'director')", name='valid_role'),
    )

# Записи на бани

class ReservationMassage(Base):
    __tablename__ = 'reservation_massages'

    reservation_id = Column(Integer, ForeignKey('reservations.reservation_id'), primary_key=True)
    massage_id = Column(Integer, ForeignKey('massages.massage_id'), primary_key=True)
    quantity = Column(Integer, default=1, nullable=False)

    reservation = relationship("Reservation", back_populates="reservation_massages")
    massage = relationship("Massage", back_populates="reservation_massages")

    def __repr__(self):
        return f"<ReservationMassage reservation_id={self.reservation_id} massage_id={self.massage_id} qty={self.quantity}>"

class ReservationBroom(Base):
    __tablename__ = 'reservation_brooms'

    reservation_id = Column(Integer, ForeignKey('reservations.reservation_id'), primary_key=True)
    broom_id = Column(Integer, ForeignKey('brooms.id'), primary_key=True)
    quantity = Column(Integer, default=1, nullable=False)

    # Связи
    reservation = relationship("Reservation", back_populates="reservation_brooms")
    broom = relationship("Broom", back_populates="reservation_brooms")

    def __repr__(self):
        return f"<ReservationBroom reservation_id={self.reservation_id} broom_id={self.broom_id} qty={self.quantity}>"


class ReservationMenuItem(Base):
    __tablename__ = 'reservation_menu_items'

    reservation_id = Column(Integer, ForeignKey('reservations.reservation_id'), primary_key=True)
    menu_item_id = Column(Integer, ForeignKey('menu_list.id'), primary_key=True)
    quantity = Column(Integer, default=1, nullable=False)

    reservation = relationship("Reservation", back_populates="reservation_menu_items")
    menu_item = relationship("MenuItem", back_populates="reservation_menu_items")

    def __repr__(self):
        return f"<ReservationMenuItem reservation_id={self.reservation_id} menu_item_id={self.menu_item_id} qty={self.quantity}>"

class ReservationStatus(Base):
    __tablename__ = "reservation_status"

    id = Column(Integer, primary_key=True)
    status_name = Column(String(50), nullable=False, unique=True)

    # Обратная связь (опционально)
    reservations = relationship("Reservation", back_populates="status_rel")

class Reservation(Base):
    __tablename__ = 'reservations'

    reservation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bath_id = Column(Integer, ForeignKey('baths.bath_id'), nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    client_name = Column(String(100), nullable=False)
    client_phone = Column(String(20), nullable=False)
    client_email = Column(String(100))
    notes = Column(Text)
    total_cost = Column(Integer, nullable=False, default=0)
    guests = Column(Integer, nullable=False)
    status_id = Column(Integer, ForeignKey('reservation_status.id'), nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    bath = relationship("Bath", back_populates="reservations")
    status_rel = relationship("ReservationStatus", back_populates="reservations")
    reservation_brooms = relationship("ReservationBroom", back_populates="reservation", cascade="all, delete-orphan")
    reservation_menu_items = relationship("ReservationMenuItem", back_populates="reservation", cascade="all, delete-orphan")
    reservation_massages = relationship("ReservationMassage", back_populates="reservation", cascade="all, delete-orphan")




# меню
class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, nullable=False)   
    name = Column(String(100), nullable=False)               
    order = Column(Integer, default=0)                      

    # Связь с товарами
    items = relationship("MenuItem", back_populates="category_rel")

    def __repr__(self):
        return f"<MenuCategory {self.name} ({self.slug})>"
    

class MenuItem(Base):
    __tablename__ = "menu_list"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(
        Integer,
        ForeignKey("menu_categories.id", ondelete="RESTRICT"), 
        nullable=False
    )
    price = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)

    category_rel = relationship("MenuCategory", back_populates="items")
    reservation_menu_items = relationship("ReservationMenuItem", back_populates="menu_item")

    def __repr__(self):
        return f"<MenuItem {self.name} (category_id={self.category_id})>"
    
# веники
class Broom(Base):
    __tablename__ = "brooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)      
    price = Column(Integer, nullable=False)           
    quantity = Column(Integer, nullable=False)      

    reservation_brooms = relationship("ReservationBroom", back_populates="broom")

# массаж

class Massage(Base):
    __tablename__ = "massages"

    massage_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True  
    )
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    cost = Column(Integer, nullable=False)

    reservation_massages = relationship("ReservationMassage", back_populates="massage")