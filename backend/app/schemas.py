from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from datetime import date


# === Логин ===
class LoginData(BaseModel):
    username: str
    password: str


# === Фото ===
class PhotoBase(BaseModel):
    image_url: str

class PhotoCreate(PhotoBase):
    pass

class PhotoOut(BaseModel):
    photo_id: int
    image_url: str
    bath_id: Optional[int] = None
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    promotion_id: Optional[int] = None

    class Config:
        from_attributes = True


# === Бани ===
class BathBase(BaseModel):
    slug: str
    name: str
    title: str
    cost_weekday: int
    cost_weekend: int
    description: Optional[str] = None
    base_guests: int
    extra_guest_price: int

class BathCreate(BathBase):
    photo_urls: List[str] = []
    promotion_ids: List[int] = []

class BathUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    cost_weekday: Optional[int] = None
    cost_weekend: Optional[int] = None
    description: Optional[str] = None
    base_guests: Optional[int] = None
    extra_guest_price: Optional[int] = None
    photo_urls: Optional[List[str]] = None
    promotion_ids: Optional[List[int]] = None

class BathOut(BathBase):
    bath_id: int
    photos: List[PhotoOut] = []
    promotions: List['PromotionBrief'] = []

    class Config:
        from_attributes = True


# === Товары в бронировании ===
class ReservationProductCreate(BaseModel):
    product_id: int
    quantity: int = 1

class ReservationProductResponse(BaseModel):
    product_id: int
    name: str
    quantity: int
    price: float
    unit_id: Optional[int] = None

    class Config:
        from_attributes = True


# === Бронирования (только баня + товары) ===
class ReservationCreate(BaseModel):
    bath_id: int
    start_datetime: str
    end_datetime: str
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    notes: Optional[str] = None
    guests: int = 1
    status_id: int = 1
    
    products: List[ReservationProductCreate] = []

    class Config:
        from_attributes = True

class ReservationUpdate(BaseModel):
    bath_id: Optional[int] = None
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    notes: Optional[str] = None
    guests: Optional[int] = None
    status_id: Optional[int] = None
    
    products: List[ReservationProductCreate] = []   

    class Config:
        from_attributes = True


# Статусы бронирований
class ReservationStatusBase(BaseModel):
    id: int
    status_name: str

    class Config:
        from_attributes = True


class ReservationResponse(BaseModel):
    reservation_id: int
    bath_id: int
    start_datetime: datetime
    end_datetime: datetime
    client_name: str
    client_phone: str
    client_email: Optional[str]
    notes: Optional[str]
    guests: int
    total_cost: int
    status: str
    applied_promotion_id: Optional[int] = None
    promotion_snapshot: Optional[dict] = None
    
    products: List[ReservationProductResponse] = []

    class Config:
        from_attributes = True


# === Заявки с сайта ===
class BookingBase(BaseModel):
    bath_id: int
    date: str
    duration_hours: int
    guests: int
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    is_read: Optional[bool] = None

class BookingOut(BookingBase):
    booking_id: int
    is_read: bool
    created_at: datetime
    bath: BathOut

    class Config:
        from_attributes = True


# === Авторизация / Пользователи ===
class UserCreate(BaseModel):
    email: str
    phone: str
    password: str
    full_name: str
    birth_date: Optional[date] = None
    is_admin: bool = False
    is_director: bool = False
    permission_ids: List[int] = []


class UserUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # если передан — меняется
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    is_admin: Optional[bool] = None
    is_director: Optional[bool] = None
    permission_ids: Optional[List[int]] = None

    class Config:
        extra = "forbid"  # или используй exclude_unset в вызове


class PermissionResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    user_id: int
    email: str
    phone: str
    full_name: str
    birth_date: Optional[date]
    is_admin: bool
    is_director: bool
    permissions: List[PermissionResponse] = []
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# === Партнёры ===
class PartnerBase(BaseModel):
    supplier_name: str
    person_name: str
    partner_inn: str
    partner_phone: str
    partner_email: str

class PartnerCreate(PartnerBase):
    pass

class PartnerUpdate(PartnerBase):
    pass

class PartnerResponse(PartnerBase):
    partner_id: int

    class Config:
        from_attributes = True


# === Клиенты ===
class ClientBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[date] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    pass

class ClientResponse(ClientBase):
    client_id: int

    class Config:
        from_attributes = True


# === Сотрудники и роли ===
class StaffBase(BaseModel):
    fullName: str
    phone: Optional[str] = None
    email: Optional[str] = None
    birthDate: Optional[date] = None
    role: str

class StaffCreate(StaffBase):
    pass

class StaffUpdate(StaffBase):
    fullName: Optional[str] = None
    role: Optional[str] = None

class StaffResponse(StaffBase):
    id: int

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True


# === Товары и склад ===
class UnitOfMeasurementBase(BaseModel):
    name: str
    description: Optional[str] = None

class UnitOfMeasurementResponse(UnitOfMeasurementBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_visible_on_website: bool = False
    is_countable: bool = True
    category_id: Optional[int] = None
    price: float = 0.0
    min_stock: float = 0.0

class ProductCreate(ProductBase):
    unit_id: Optional[int] = None

class ProductPhotoOut(BaseModel):
    photo_id: int
    image_url: str

    class Config:
        from_attributes = True

class Product(ProductBase):
    id: int
    total_quantity: float
    last_purchase_price: float
    is_price_manual: bool = False
    min_stock: float = 0.0
    unit_id: Optional[int] = None
    photos: List[ProductPhotoOut] = []

    class Config:
        from_attributes = True


# === Категории товаров (для склада) ===
class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    is_visible_on_website: bool = False

class CategoryCreate(CategoryBase):
    photo_urls: Optional[List[str]] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    is_visible_on_website: Optional[bool] = None
    photo_urls: Optional[List[str]] = None

class Category(CategoryBase):
    id: int
    children: List['Category'] = []
    photos: List[PhotoOut] = []

    class Config:
        from_attributes = True

Category.model_rebuild()


class WebsiteCategoryProduct(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    photos: List[ProductPhotoOut] = []

    class Config:
        from_attributes = True


class WebsiteCategoryPreview(BaseModel):
    id: int
    name: str
    photos: List[PhotoOut] = []
    products: List[WebsiteCategoryProduct] = []

    class Config:
        from_attributes = True


# === Приходные документы ===
class EntranceDocumentItemBase(BaseModel):
    product_id: int
    quantity: int
    purchase_price: float

class EntranceDocumentItemCreate(EntranceDocumentItemBase):
    pass

class EntranceDocumentItemRead(EntranceDocumentItemBase):
    id: int
    product: Product

    class Config:
        from_attributes = True

class EntranceDocumentBase(BaseModel):
    date: date
    supplier_id: int
    responsible_name: str
    supplier_number: Optional[str] = None
    comment: Optional[str] = None
    total_amount: float

class EntranceDocumentCreate(EntranceDocumentBase):
    items: List[EntranceDocumentItemCreate]

class EntranceDocumentRead(EntranceDocumentBase):
    id: int
    supplier: PartnerResponse
    items: List[EntranceDocumentItemRead] = []

    class Config:
        from_attributes = True


# === Склад: Товары ===
class StockProduct(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    is_countable: bool = True
    total_quantity: int = 0
    last_purchase_price: float = 0.0
    price: float = 0.0
    is_price_manual: bool = False
    min_stock: float = 0.0
    unit_id: Optional[int] = None 

    class Config:
        from_attributes = True

# Роли доступа



class PagePermissionBase(BaseModel):
    path: str
    title: str
    allowed_roles: List[int]  

class PagePermissionCreate(PagePermissionBase):
    pass

class PagePermissionUpdate(BaseModel):
    allowed_roles: List[int]

class PagePermissionOut(PagePermissionBase):
    id: int

    class Config:
        from_attributes = True


# Password Reset Schemas
class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetVerify(BaseModel):
    email: str
    code: str

class PasswordResetComplete(BaseModel):
    email: str
    code: str
    new_password: str


class SettingsResponse(BaseModel):
    id: int
    key: str
    value: float
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    cleaning_time_minutes: Optional[int] = None
    booking_interval_minutes: Optional[int] = None
    markup_percent: Optional[float] = None
    update_manual_prices: Optional[bool] = False


# === Акции ===
class PromotionGiftProductCreate(BaseModel):
    product_id: int
    quantity: int = 1


class PromotionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    
    # Условия
    min_hours: Optional[int] = None
    min_guests: Optional[int] = None
    min_amount: Optional[float] = None
    applicable_weekdays: Optional[List[int]] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    
    # Подарки
    bonus_minutes: Optional[int] = None
    gift_products: List[PromotionGiftProductCreate] = []


class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    min_hours: Optional[int] = None
    min_guests: Optional[int] = None
    min_amount: Optional[float] = None
    applicable_weekdays: Optional[List[int]] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    
    bonus_minutes: Optional[int] = None
    gift_products: Optional[List[PromotionGiftProductCreate]] = None


class PromotionGiftProductResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    
    class Config:
        from_attributes = True


class PromotionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    
    min_hours: Optional[int]
    min_guests: Optional[int]
    min_amount: Optional[float]
    applicable_weekdays: Optional[List[int]]
    valid_from: Optional[date]
    valid_until: Optional[date]
    
    bonus_minutes: Optional[int]
    gift_products: List[PromotionGiftProductResponse]
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PromotionBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    min_hours: Optional[int] = None
    min_guests: Optional[int] = None
    min_amount: Optional[float] = None
    bonus_minutes: Optional[int] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    
    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    user_full_name: Optional[str] = None
    
    # Новые поля для детальной информации
    summary: Optional[str] = None
    bath_name: Optional[str] = None
    client_name: Optional[str] = None
    event_datetime: Optional[datetime] = None
    product_list: Optional[str] = None

    class Config:
        from_attributes = True


# === Документы реализации ===
class RealizationDocumentItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class RealizationDocumentItemRead(RealizationDocumentItemBase):
    id: int
    product: 'Product'
    
    class Config:
        from_attributes = True

class RealizationDocumentBase(BaseModel):
    date: date
    reservation_id: int
    client_name: str
    client_phone: str
    total_amount: float

class RealizationDocumentRead(RealizationDocumentBase):
    id: int
    items: List[RealizationDocumentItemRead] = []
    
    class Config:
        from_attributes = True


# === Чат поддержки ===
class SupportTicketCreate(BaseModel):
    title: str
    description: str


class SupportTicketUpdate(BaseModel):
    status: str  # pending/closed


class SupportTicketAttachmentResponse(BaseModel):
    id: int
    ticket_id: int
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SupportMessageCreate(BaseModel):
    message: str


class SupportMessageResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    message: str
    is_from_admin: bool
    created_at: datetime
    user_full_name: str
    
    class Config:
        from_attributes = True


class SupportTicketResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    user_full_name: str
    user_email: str
    user_phone: str
    messages: List[SupportMessageResponse] = []
    attachments: List[SupportTicketAttachmentResponse] = []
    admin_has_replied: bool = False
    
    class Config:
        from_attributes = True


class SupportTicketListItem(BaseModel):
    id: int
    user_id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    user_full_name: str
    user_email: str
    message_count: int = 0
    last_message_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True