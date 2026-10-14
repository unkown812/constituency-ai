from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Constituency AI API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/constituency_ai"
    redis_url: str = "redis://localhost:6379/0"
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "submissions"
    embedding_dim: int = 768

    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_storage_bucket: str = "complaints-media"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 43200  # 30 days

    storage_bucket: str = "constituency-ai-uploads"
    max_upload_size_mb: int = 50
    max_image_uploads: int = 3
    allowed_image_types: list[str] = ["image/jpeg", "image/png", "image/webp"]
    allowed_audio_types: list[str] = ["audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/webm"]
    allowed_document_types: list[str] = ["application/pdf", "image/jpeg", "image/png"]

    ai_service_mode: str = "local"  # or "remote"
    ai_services_base_url: str = "http://ai-services:8000"
    translation_service_url: str = "http://translation:8002"
    speech_service_url: str = "http://speech:8001"
    llm_service_url: str = "http://llm:8003"
    vision_service_url: str = "http://vision:8004"
    embeddings_service_url: str = "http://embeddings:8005"
    ocr_service_url: str = "http://ocr:8006"
    recommendation_service_url: str = "http://recommendation:8007"

    sentry_dsn: str | None = None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
