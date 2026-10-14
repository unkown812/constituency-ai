from fastapi import APIRouter

from app.schemas.constants import CategoriesResponse, LanguagesResponse
from app.services.constants_service import ConstantsService

router = APIRouter(prefix="/constants", tags=["constants"])


@router.get("/categories", response_model=CategoriesResponse)
async def get_categories() -> CategoriesResponse:
    service = ConstantsService()
    return await service.get_categories()


@router.get("/languages", response_model=LanguagesResponse)
async def get_languages() -> LanguagesResponse:
    service = ConstantsService()
    return await service.get_languages()
