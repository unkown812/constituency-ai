import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.schemas.upload import UploadResponse, VoiceTranscribeResponse
from app.utils.supabase_storage import upload_file

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_TYPES = settings.allowed_image_types
ALLOWED_AUDIO_TYPES = settings.allowed_audio_types
ALLOWED_DOC_TYPES = settings.allowed_document_types
MAX_SIZE = settings.max_upload_size_mb * 1024 * 1024


class UploadService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def upload(self, file: UploadFile) -> UploadResponse:
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise ValueError(f"File exceeds {settings.max_upload_size_mb}MB limit")

        file_type = file.content_type or "application/octet-stream"
        if file_type.startswith("image/"):
            if file_type not in ALLOWED_IMAGE_TYPES:
                raise ValueError(f"Image type {file_type} not allowed")
            folder = "images"
        elif file_type.startswith("audio/"):
            if file_type not in ALLOWED_AUDIO_TYPES:
                raise ValueError(f"Audio type {file_type} not allowed")
            folder = "audio"
        else:
            if file_type not in ALLOWED_DOC_TYPES:
                raise ValueError(f"File type {file_type} not allowed")
            folder = "documents"

        url = await upload_file(content, folder, file.filename)
        return UploadResponse(
            url=url,
            file_type=file_type,
            file_size=len(content),
            original_name=file.filename or "file",
        )

    async def transcribe_voice(
        self, file: UploadFile, current_user: User
    ) -> VoiceTranscribeResponse:
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise ValueError(f"File exceeds {settings.max_upload_size_mb}MB limit")

        if file.content_type and not file.content_type.startswith("audio/"):
            raise ValueError("Only audio files are supported for transcription")

        folder = "voice"
        url = await upload_file(content, folder, file.filename)

        transcript = ""
        transcript_en = None
        duration = None
        detected_language = None

        try:
            import httpx
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"{settings.speech_service_url}/transcribe",
                    files={"file": (file.filename or "audio.webm", content, file.content_type or "audio/webm")},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    transcript = data.get("transcript", "")
                    transcript_en = data.get("transcript_en")
                    duration = data.get("duration_seconds")
                    detected_language = data.get("detected_language")
        except Exception:
            transcript = ""

        return VoiceTranscribeResponse(
            url=url,
            transcript=transcript,
            transcript_en=transcript_en,
            duration_seconds=float(duration) if duration is not None else None,
            detected_language=detected_language,
        )
