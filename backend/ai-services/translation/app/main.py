import logging
import torch
from fastapi import FastAPI, HTTPException
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Translation Service", version="1.0.0")

_model = None
_tokenizer = None
_device = None

LANGUAGE_MAP = {
    "hi": ("hin_Deva", "Hindi"),
    "bn": ("ben_Beng", "Bengali"),
    "ta": ("tam_Taml", "Tamil"),
    "te": ("tel_Telu", "Telugu"),
    "kn": ("kan_Knda", "Kannada"),
    "mr": ("mar_Deva", "Marathi"),
    "gu": ("guj_Gujr", "Gujarati"),
    "ml": ("mal_Mlym", "Malayalam"),
    "or": ("ory_Orya", "Odia"),
    "pa": ("pan_Guru", "Punjabi"),
    "en": ("eng_Latn", "English"),
}

def get_device():
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device

def get_model():
    global _model, _tokenizer
    if _model is None:
        model_name = "facebook/nllb-200-distilled-600M"
        logger.info(f"Loading translation model {model_name} on {get_device()}...")
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(get_device())
        logger.info("Translation model loaded")
    return _model, _tokenizer

def detect_language(text: str) -> tuple[str, float]:
    import langdetect
    try:
        lang = langdetect.detect(text)
        if lang in LANGUAGE_MAP:
            return lang, 0.95
        return "en", 0.5
    except Exception:
        return "en", 0.5

@app.post("/translate")
async def translate(body: dict):
    try:
        text = body.get("text", "")
        source_language = body.get("source_language")
        target_language = body.get("target_language", "en")

        if not text.strip():
            return {"translated_text": "", "detected_source_language": "en", "confidence": 1.0}

        detected_lang = source_language
        confidence = 1.0
        if not detected_lang:
            detected_lang, confidence = detect_language(text)

        if detected_lang == target_language:
            return {
                "translated_text": text,
                "detected_source_language": detected_lang,
                "confidence": 1.0,
                "detected_script": None,
            }

        if detected_lang not in LANGUAGE_MAP:
            return {
                "translated_text": text,
                "detected_source_language": detected_lang,
                "confidence": 0.0,
            }

        model, tokenizer = get_model()
        src = LANGUAGE_MAP[detected_lang][0]
        tgt = LANGUAGE_MAP.get(target_language, "eng_Latn")[0]

        tokenizer.src_lang = src
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(get_device())

        with torch.no_grad():
            translated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=tokenizer.lang_code_to_id[tgt],
                max_length=512,
            )

        translated_text = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]

        return {
            "translated_text": translated_text,
            "detected_source_language": detected_lang,
            "confidence": round(confidence, 2),
            "detected_script": None,
        }
    except Exception as e:
        logger.exception("Translation failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "TRANSLATION_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {"status": "ok", "model": "nllb-200-distilled-600M", "device": get_device()}
