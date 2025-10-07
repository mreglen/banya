from fastapi import APIRouter
from app.routers.baths import router as baths_router
from app.routers.massages import router as massages_router
from app.routers.bookings import router as bookings_router
from app.routers.admin_auth import router as auth_router
from app.routers.admin_reservations import router as reservations
from app.routers.kitchen import router as kitchen
from app.routers.brooms import router as brooms
from app.routers.reservation_status import router as reservations_status

api_router = APIRouter(prefix="/api")


api_router.include_router(baths_router)
api_router.include_router(massages_router)
api_router.include_router(bookings_router)
api_router.include_router(auth_router)
api_router.include_router(reservations)
api_router.include_router(kitchen)
api_router.include_router(brooms)
api_router.include_router(reservations_status) 