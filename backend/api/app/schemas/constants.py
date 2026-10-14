from pydantic import BaseModel, Field


class CategoryItem(BaseModel):
    id: str
    label_en: str
    icon: str


class CategoriesResponse(BaseModel):
    categories: list[CategoryItem]


class LanguageItem(BaseModel):
    code: str
    name_en: str
    name_native: str


class LanguagesResponse(BaseModel):
    languages: list[LanguageItem]
