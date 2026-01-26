from fastapi import APIRouter
from app.api.endpoints import health, search, location, export, system

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(search.router, tags=["search"])
api_router.include_router(location.router, tags=["location"])
api_router.include_router(export.router, tags=["export"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
