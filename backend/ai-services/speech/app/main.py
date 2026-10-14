import io
import logging
import time
from pathlib import Path

import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Speech Service", version="1.0.0")

_model = None
_device = None

def get_device():
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device

def get_model():
    global _model
    if _model is None:
        import whisper
        model_name = "large-v3"
        logger.info(f"Loading Whisper model {model_name} on {get_device()}...")
        _model = whisper.load_model(model_name, device=get_device())
        logger.info("Whisper model loaded")
    return _model

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form(None)):
    start = time.time()
    try:
        contents = await file.read()
        audio = io.BytesIO(contents)

        model = get_model()
        options = {"task": "transcribe"}
        if language:
            options["language"] = language

        result = model.transcribe(audio, **options)

        segments_data = []
        for seg in result.get("segments", []):
            segments_data.append({
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
                "text": seg.get("text", "").strip(),
            })

        detected_lang = result.get("language", language or "en")
        transcript = result.get("text", "").strip()

        transcript_en = transcript
        if detected_lang != "en":
            try:
                translation_options = {**options, "task": "translate"}
                trans_result = model.transcribe(audio, **translation_options)
                transcript_en = trans_result.get("text", "").strip()
            except Exception:
                transcript_en = ""

        duration = time.time() - start

        return {
            "transcript": transcript,
            "transcript_en": transcript_en or None,
            "detected_language": detected_lang,
            "language_confidence": result.get("language_confidence", 0.0),
            "segments": segments_data[:10],
            "duration_seconds": round(duration, 2),
        }
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "INFERENCE_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "whisper-large-v3",
        "device": get_device(),
    }
