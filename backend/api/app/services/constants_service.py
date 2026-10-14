from app.schemas.constants import CategoriesResponse, CategoryItem, LanguageItem, LanguagesResponse


class ConstantsService:
    async def get_categories(self) -> CategoriesResponse:
        categories = [
            CategoryItem(id="roads", label_en="Roads & Infrastructure", icon="road"),
            CategoryItem(id="sanitation", label_en="Sanitation & Waste Management", icon="trash"),
            CategoryItem(id="water", label_en="Water Supply", icon="droplet"),
            CategoryItem(id="electricity", label_en="Electricity & Power", icon="zap"),
            CategoryItem(id="public_safety", label_en="Public Safety", icon="shield"),
            CategoryItem(id="health", label_en="Health & Sanitation", icon="heart"),
            CategoryItem(id="education", label_en="Education", icon="book"),
            CategoryItem(id="other", label_en="Other", icon="more-horizontal"),
        ]
        return CategoriesResponse(categories=categories)

    async def get_languages(self) -> LanguagesResponse:
        languages = [
            LanguageItem(code="en", name_en="English", name_native="English"),
            LanguageItem(code="hi", name_en="Hindi", name_native="हिन्दी"),
            LanguageItem(code="bn", name_en="Bengali", name_native="বাংলা"),
            LanguageItem(code="te", name_en="Telugu", name_native="తెలుగు"),
            LanguageItem(code="mr", name_en="Marathi", name_native="मराठी"),
            LanguageItem(code="ta", name_en="Tamil", name_native="தமிழ்"),
            LanguageItem(code="gu", name_en="Gujarati", name_native="ગુજરાતી"),
            LanguageItem(code="kn", name_en="Kannada", name_native="ಕನ್ನಡ"),
            LanguageItem(code="ml", name_en="Malayalam", name_native="മലയാളം"),
            LanguageItem(code="pa", name_en="Punjabi", name_native="ਪੰਜਾਬੀ"),
            LanguageItem(code="or", name_en="Odia", name_native="ଓଡ଼ିଆ"),
            LanguageItem(code="ur", name_en="Urdu", name_native="اردو"),
        ]
        return LanguagesResponse(languages=languages)
