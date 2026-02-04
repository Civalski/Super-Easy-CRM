from fastapi import APIRouter
from app.api.endpoints import health, system
from app.core.config import settings

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])

if settings.BACKEND_ENABLED:
    api_router.include_router(system.router, prefix="/system", tags=["system"])
