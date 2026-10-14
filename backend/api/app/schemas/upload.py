from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    url: str
    thumbnail_url: str | None = None
    file_type: str
    file_size: int
    original_name: str


class VoiceTranscribeResponse(BaseModel):
    url: str
    transcript: str
    transcript_en: str | None = None
    duration_seconds: float | None = None
    detected_language: str | None = None
