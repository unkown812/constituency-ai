import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OCR Service", version="1.0.0")

_ocr = None

def get_ocr():
    global _ocr
    if _ocr is None:
        logger.info("Loading PaddleOCR...")
        from paddleocr import PaddleOCR
        _ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        logger.info("PaddleOCR loaded")
    return _ocr

@app.post("/extract")
async def extract(file: UploadFile = File(...), language: str = Form(None)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        temp_path = f"/tmp/ocr_{id(contents)}.png"
        image.save(temp_path)

        ocr = get_ocr()
        result = ocr.ocr(temp_path, cls=True)

        import os
        try:
            os.remove(temp_path)
        except Exception:
            pass

        extracted_text = ""
        blocks = []
        confidences = []

        if result and result[0]:
            for line in result[0]:
                bbox = line[0]
                text_info = line[1]
                text = text_info[0]
                conf = text_info[1]

                extracted_text += text + "\n"
                confidences.append(conf)

                blocks.append({
                    "text": text,
                    "bbox": [bbox[0][0], bbox[0][1], bbox[2][0], bbox[2][1]],
                    "confidence": round(conf, 2),
                    "type": "paragraph",
                })

        overall_conf = sum(confidences) / max(len(confidences), 1)

        return {
            "extracted_text": extracted_text.strip(),
            "extracted_text_en": extracted_text.strip(),
            "detected_language": language or "en",
            "confidence": round(overall_conf, 2),
            "blocks": blocks[:20],
            "page_count": 1,
        }
    except ImportError:
        logger.warning("PaddleOCR not available, using fallback")
        return {
            "extracted_text": "",
            "extracted_text_en": None,
            "detected_language": "en",
            "confidence": 0.0,
            "blocks": [],
            "page_count": 1,
        }
    except Exception as e:
        logger.exception("OCR failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "OCR_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {"status": "ok", "model": "paddleocr-v4", "device": "cpu"}
