from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# логин
class LoginData(BaseModel):
    username: str
    password: str

# фото

class PhotoBase(BaseModel):
    image_url: str


class PhotoCreate(PhotoBase):
    pass

class PhotoOut(BaseModel):
    photo_id: int
    image_url: str
    bath_id: Optional[int] = None
    massage_id: Optional[int] = None

    class Config:
        from_attributes = True

# Бани

class BathFeatureBase(BaseModel):
    key: str
    value: str


class BathFeatureCreate(BathFeatureBase):
    pass


class BathFeatureOut(BathFeatureBase):
    feature_id: int

    class Config:
        from_attributes = True


class BathBase(BaseModel):
    name: str
    title: str
    cost: int
    description: Optional[str] = None
    base_guests: int         
    extra_guest_price: int


class BathCreate(BathBase):
    features: List[BathFeatureCreate] = []     # 👈 Теперь корректно
    photo_urls: List[str] = []


class BathUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    cost: Optional[int] = None
    description: Optional[str] = None
    base_guests: Optional[int] = None          # ✅
    extra_guest_price: Optional[int] = None    # ✅
    photo_urls: Optional[List[str]] = None
    features: Optional[List[BathFeatureCreate]] = None


class BathOut(BathBase):
    bath_id: int
    photos: List[PhotoOut] = []
    features: List[BathFeatureOut] = []

    class Config:
        from_attributes = True


# Массаж

class MassageBase(BaseModel):
    name: str
    description: str  
    cost: int

class MassageCreate(MassageBase):
    pass  


class MassageUpdate(BaseModel):  
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[int] = None



class MassageRead(MassageBase):
    massage_id: int

    class Config:
        from_attributes = True


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

# Авторизация

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

# меню

class MenuCategoryBase(BaseModel):
    id: int
    slug: str
    name: str
    order: int

    class Config:
        from_attributes = True

class MenuCategoryCreate(BaseModel):
    slug: str
    name: str
    order: int = 0

class MenuCategoryUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    order: Optional[int] = None

class MenuItemBase(BaseModel):
    name: str
    price: int
    description: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    category_id: int  

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None
    category_id: Optional[int] = None

class MenuItemRead(MenuItemBase):
    id: int
    category: MenuCategoryBase

    class Config:
        from_attributes = True

class MenuCategoryResponse(BaseModel):
    id: int
    slug: str
    name: str
    order: int

class MenuItemResponse(BaseModel):
    id: int
    name: str
    category_id: int
    price: int
    description: Optional[str]

# Бронь бань
class ReservationStatusBase(BaseModel):
    id: int
    status_name: str

    class Config:
        from_attributes = True

class ReservationMassageCreate(BaseModel):
    massage_id: int
    quantity: int = 1

class ReservationBroomCreate(BaseModel):
    broom_id: int
    quantity: int = 1

class ReservationMenuItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1

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
    brooms: List[ReservationBroomCreate] = []
    menu_items: List[ReservationMenuItemCreate] = []
    massages: List[ReservationMassageCreate] = []  # 👈 ДОБАВЛЕНО

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
    brooms: List[ReservationBroomCreate] = []
    menu_items: List[ReservationMenuItemCreate] = []
    massages: List[ReservationMassageCreate] = []  # 👈 ДОБАВЛЕНО

    class Config:
        from_attributes = True

# --- Response схемы ---
class ReservationStatusBase(BaseModel):
    id: int
    status_name: str

    class Config:
        from_attributes = True

class ReservationMassageResponse(BaseModel):
    massage_id: int
    name: str
    cost: int
    quantity: int

    class Config:
        from_attributes = True

class ReservationBroomResponse(BaseModel):
    broom_id: int
    name: str
    price: int
    quantity: int

    class Config:
        from_attributes = True

class ReservationMenuItemResponse(BaseModel):
    menu_item_id: int
    name: str
    price: int
    quantity: int
    category: MenuCategoryBase

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

    brooms: List[ReservationBroomResponse] = []
    menu_items: List[ReservationMenuItemResponse] = []
    massages: List[ReservationMassageResponse] = []  

    class Config:
        from_attributes = True


# венники

class BroomResponse(BaseModel):
    id: int
    name: str
    price: int
    quantity: int

class BroomBase(BaseModel):
    name: str
    price: float
    quantity: int


class BroomCreate(BroomBase):
    pass


class BroomUpdate(BroomBase):
    pass


class BroomRead(BroomBase):
    id: int

    class Config:
        from_attributes = True