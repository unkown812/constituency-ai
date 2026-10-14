import uuid
from pathlib import Path
from app.core.config import settings

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def upload_file(file_data: bytes, folder: str, filename: str | None = None) -> str:
    ext = Path(filename or "file").suffix if filename else ""
    file_id = f"{uuid.uuid4()}{ext}"
    relative_path = f"{folder}/{file_id}"
    file_path = UPLOAD_DIR / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(file_data)
    return f"/uploads/{relative_path}"

async def get_presigned_url(path: str, expires_in: int = 3600) -> str:
    return path
