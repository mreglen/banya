from sqlalchemy import Column, Float, Integer, String, Text, ForeignKey, DateTime, Boolean, Date, CheckConstraint, func, Table
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date
from sqlalchemy.dialects.postgresql import ARRAY, JSON


class Bath(Base):
    __tablename__ = "baths"

    bath_id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    cost_weekday = Column(Integer, nullable=False)
    cost_weekend = Column(Integer, nullable=False)
    min_booking_hours = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    base_guests = Column(Integer, nullable=False)
    extra_guest_price = Column(Integer, nullable=False)

    photos = relationship("Photo", back_populates="bath", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="bath", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="bath")
    promotions = relationship("Promotion", secondary="bath_promotions", back_populates="baths")


class Photo(Base):
    __tablename__ = "photos"

    photo_id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(500), nullable=False)

    bath_id = Column(Integer, ForeignKey("baths.bath_id", ondelete="CASCADE"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    bath = relationship("Bath", back_populates="photos")
    product = relationship("Product", back_populates="photos")
    category = relationship("Category", back_populates="photos")



# Бронирование с сайта
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





# Статусы бронирований
class ReservationStatus(Base):
    __tablename__ = "reservation_status"

    id = Column(Integer, primary_key=True)
    status_name = Column(String(50), nullable=False, unique=True)
    reservations = relationship("Reservation", back_populates="status_rel")


# Основная бронь
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
    income_account_id = Column(Integer, ForeignKey("organization_accounts.id"), nullable=True)
    applied_promotion_id = Column(Integer, ForeignKey('promotions.id'), nullable=True)
    promotion_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bath = relationship("Bath", back_populates="reservations")
    status_rel = relationship("ReservationStatus", back_populates="reservations")
    income_account = relationship("OrganizationAccount")
    reservation_products = relationship("ReservationProduct", back_populates="reservation", cascade="all, delete-orphan")


# === Компания: Партнёры ===
class Partner(Base):
    __tablename__ = "partners"

    partner_id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(100), nullable=False)
    person_name = Column(String(100), nullable=False)
    partner_inn = Column(String(12), nullable=False)
    partner_phone = Column(String(20), nullable=False)
    partner_email = Column(String(100), nullable=False)


# === Компания: Клиенты ===
class Client(Base):
    __tablename__ = "clients"

    client_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    birth_date = Column(Date, nullable=True)






# === Склад: Категории и товары ===
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_visible_on_website = Column(Boolean, nullable=False, default=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    children = relationship("Category", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("Category", remote_side=[id], back_populates="children")
    products = relationship("Product", back_populates="category")
    photos = relationship("Photo", back_populates="category", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_visible_on_website = Column(Boolean, default=False)
    is_countable = Column(Boolean, nullable=False, default=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    total_quantity = Column(Float, default=0)
    last_purchase_price = Column(Float, default=0.0)
    price = Column(Float, default=0.0)
    is_price_manual = Column(Boolean, nullable=False, default=False)
    min_stock = Column(Float, default=0.0)
    unit_id = Column(Integer, ForeignKey("units_of_measurement.id"), nullable=True)

    category = relationship("Category", back_populates="products")
    photos = relationship("Photo", back_populates="product")
    unit = relationship("UnitOfMeasurement")


class UnitOfMeasurement(Base):
    __tablename__ = "units_of_measurement"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True) 
    description = Column(String(100), nullable=True)


# === Приходные документы ===
class EntranceDocument(Base):
    __tablename__ = "entrance_documents"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=date.today)
    supplier_id = Column(Integer, ForeignKey("partners.partner_id"), nullable=False)
    responsible_name = Column(String, nullable=False)
    supplier_number = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    account_id = Column(Integer, ForeignKey("organization_accounts.id"), nullable=True)

    supplier = relationship("Partner", backref="entrance_documents")
    account = relationship("OrganizationAccount")
    items = relationship("EntranceDocumentItem", back_populates="document", cascade="all, delete-orphan")


class EntranceDocumentItem(Base):
    __tablename__ = "entrance_document_items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("entrance_documents.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    purchase_price = Column(Float, nullable=False)

    document = relationship("EntranceDocument", back_populates="items")
    product = relationship("Product")


# === Товары в бронировании ===
class ReservationProduct(Base):
    __tablename__ = 'reservation_products'

    reservation_id = Column(Integer, ForeignKey('reservations.reservation_id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

    reservation = relationship("Reservation", back_populates="reservation_products")
    product = relationship("Product")

    def __repr__(self):
        return f"<ReservationProduct reservation_id={self.reservation_id} product_id={self.product_id} qty={self.quantity}>"

# Права доступа


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), nullable=False, unique=True)  # например: "reservations:view"
    name = Column(String(255), nullable=False)  # отображаемое имя: "Просмотр бронирований"
    category = Column(String(100), nullable=False)  # группа: "reservations", "storage"
    description = Column(String(255), nullable=True)


# Таблица many-to-many для связи User-Permission (legacy)
user_permissions = Table(
    'user_permissions',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.user_id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

# Таблица many-to-many для связи Role-Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)


class PagePermission(Base):
    __tablename__ = "page_permissions"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String(255), nullable=False, unique=True) 
    title = Column(String(255), nullable=False) 
    allowed_roles = Column(ARRAY(Integer), nullable=False) 

# === Компания: Сотрудники и роли ===



class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")


class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    password_hash = Column(String(128), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_director = Column(Boolean, default=False, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

   
    full_name = Column(String, nullable=False)
    birth_date = Column(Date)

    role_rel = relationship("Role")

    @property
    def permissions(self):
        if self.role_rel and self.role_rel.permissions:
            return self.role_rel.permissions
        return []


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    code = Column(String(6), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)


class OrganizationDetails(Base):
    __tablename__ = "organization_details"

    id = Column(Integer, primary_key=True)
    address = Column(Text, nullable=False, default="")
    inn = Column(Text, nullable=False, default="")
    kpp = Column(Text, nullable=False, default="")
    requisites = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class OrganizationAccount(Base):
    __tablename__ = "organization_accounts"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(Text, nullable=False)
    account_number = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    refresh_token = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    device_info = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    user = relationship("User")


# === Акции ===
class Promotion(Base):
    __tablename__ = "promotions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Условия
    min_hours = Column(Integer, nullable=True)
    min_guests = Column(Integer, nullable=True)
    min_amount = Column(Float, nullable=True)
    applicable_weekdays = Column(ARRAY(Integer), nullable=True)
    valid_from = Column(Date, nullable=True)
    valid_until = Column(Date, nullable=True)
    
    # Подарки
    bonus_minutes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    gift_products = relationship("PromotionGiftProduct", back_populates="promotion", cascade="all, delete-orphan")
    baths = relationship("Bath", secondary="bath_promotions", back_populates="promotions")


class PromotionGiftProduct(Base):
    __tablename__ = "promotion_gift_products"
    
    promotion_id = Column(Integer, ForeignKey("promotions.id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)
    
    promotion = relationship("Promotion", back_populates="gift_products")
    product = relationship("Product")


class BathPromotion(Base):
    __tablename__ = "bath_promotions"
    
    bath_id = Column(Integer, ForeignKey("baths.bath_id", ondelete="CASCADE"), primary_key=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id", ondelete="CASCADE"), primary_key=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity_type = Column(String(50), nullable=False)  # reservation, user, product, etc.
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # дополнительная информация
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Новые поля для детальной информации
    summary = Column(Text, nullable=True)  # Человеко-читаемое описание
    bath_name = Column(String(100), nullable=True)
    client_name = Column(String(100), nullable=True)
    event_datetime = Column(DateTime(timezone=True), nullable=True)
    product_list = Column(Text, nullable=True)  # "Веник дубовый x2, Чай x1"

    user = relationship("User")


# === Документы реализации ===
class RealizationDocument(Base):
    __tablename__ = "realization_documents"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=date.today)
    reservation_id = Column(Integer, ForeignKey("reservations.reservation_id"), nullable=False)
    bath_id = Column(Integer, ForeignKey("baths.bath_id"), nullable=True)
    client_name = Column(String(100), nullable=False)
    client_phone = Column(String(20), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    account_id = Column(Integer, ForeignKey("organization_accounts.id"), nullable=True)

    reservation = relationship("Reservation")
    bath = relationship("Bath")
    account = relationship("OrganizationAccount")
    items = relationship("RealizationDocumentItem", back_populates="document", cascade="all, delete-orphan")


class RealizationDocumentItem(Base):
    __tablename__ = "realization_document_items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("realization_documents.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    document = relationship("RealizationDocument", back_populates="items")
    product = relationship("Product")


# === Чат поддержки ===
class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(200), nullable=False)  # Заголовок вопроса
    description = Column(Text, nullable=False)  # Описание проблемы
    status = Column(String(20), default="pending")  # pending/closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User")
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("SupportTicketAttachment", back_populates="ticket", cascade="all, delete-orphan")


class SupportMessage(Base):
    __tablename__ = "support_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    message = Column(Text, nullable=False)
    is_from_admin = Column(Boolean, default=False)  # Кто отправил
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("SupportTicket", back_populates="messages")
    user = relationship("User")


class SupportTicketAttachment(Base):
    __tablename__ = "support_ticket_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("SupportTicket", back_populates="attachments")