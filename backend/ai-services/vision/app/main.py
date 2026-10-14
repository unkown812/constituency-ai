import logging
import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vision Service", version="1.0.0")

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
        from ultralytics import YOLO
        logger.info("Loading YOLO model...")
        _model = YOLO("yolo11n.pt")
        logger.info("YOLO model loaded")
    return _model

RELEVANT_CLASSES = {
    "pothole": 0,
    "car": 2,
    "truck": 7,
    "bus": 5,
    "person": 0,
    "bottle": 39,
    "chair": 56,
    "tv": 62,
}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), category_hint: str = Form("")):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        model = get_model()
        results = model(image, verbose=False)

        detections = []
        objects_detected = set()
        has_relevant_issue = False
        max_issue_conf = 0.0

        if results and len(results) > 0:
            boxes = results[0].boxes
            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist() if hasattr(box, 'xyxy') else [0, 0, 0, 0]

                    label = results[0].names.get(cls_id, f"class_{cls_id}")
                    objects_detected.add(label)

                    is_relevant = label in RELEVANT_CLASSES or conf > 0.8
                    if is_relevant:
                        has_relevant_issue = True
                        max_issue_conf = max(max_issue_conf, conf)

                    detections.append({
                        "label": label,
                        "confidence": round(conf, 2),
                        "bbox": [round(x, 1) for x in xyxy],
                    })

        scene_desc_parts = []
        if detections:
            top_labels = [d["label"] for d in detections[:3]]
            scene_desc_parts.append(f"Image contains: {', '.join(top_labels)}")
        else:
            scene_desc_parts.append("No objects detected")

        return {
            "detections": detections[:10],
            "scene_description": ". ".join(scene_desc_parts),
            "objects_detected": list(objects_detected)[:10],
            "has_relevant_issue": has_relevant_issue,
            "issue_confidence": round(max_issue_conf, 2) if has_relevant_issue else 0.0,
            "image_quality": {"blur_score": 0.0, "lighting": "unknown"},
        }
    except Exception as e:
        logger.exception("Image analysis failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "ANALYSIS_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {"status": "ok", "models": ["yolo11n"], "device": get_device()}
