# AI Microservices Contracts — Constituency AI

## Overview

The AI pipeline processes every citizen submission through a sequence of microservices. The pipeline is orchestrated by **Celery tasks** running in the backend worker. Each service is a standalone FastAPI application running as a Docker container.

**Architecture Flow:**

```
Submission Created (status: new)
        │
        ▼
┌─────────────────┐
│  Translation    │  Translate description from detected language → English
│  (port 8002)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Speech         │  If voice file attached: transcribe (Whisper)
│  (port 8001)    │  Append transcript to description
└────────┬────────┘
         ▼
┌─────────────────┐
│  OCR            │  If document/image with text: extract text
│  (port 8006)    │  Append extracted text to description
└────────┬────────┘
         ▼
┌─────────────────┐
│  LLM            │  Classify category, generate title & summary
│  (port 8003)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Vision         │  If images: analyze for visual context
│  (port 8004)    │  (pothole detection, garbage spotting, etc.)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Embeddings     │  Generate vector embedding for similarity search
│  (port 8005)    │  Store in Qdrant
└────────┬────────┘
         ▼
┌─────────────────┐
│  Geotagging     │  Reverse-geocode coordinates → ward + constituency
│  (in API)       │
└────────┬────────┘
         ▼
Submission Updated (status: analyzed → under_review)
```

---

## 1. Translation Service (`/translate`)

**Port:** 8002
**Purpose:** Detect source language and translate citizen description from any Indian language to English.

### Translate Endpoint

```http
POST http://translation:8002/translate
Content-Type: application/json

{
  "text": "एमजी रोड जंक्शन के पास बड़ा गड्ढा है, कृपया इसे जल्दी ठीक करवाएं",
  "source_language": null,
  "target_language": "en"
}
```

**Response `200`:**

```json
{
  "translated_text": "There is a big pothole near MG Road junction, please get it fixed soon",
  "detected_source_language": "hi",
  "confidence": 0.98,
  "detected_script": "Devanagari"
}
```

**Notes:**
- If `source_language` is `null`, the service auto-detects.
- Supported languages: `hi`, `bn`, `ta`, `te`, `kn`, `mr`, `gu`, `ml`, `or`, `pa`, `en`.
- Must handle code-mixed text (Hinglish, Tanglish, etc.).

### Health Check

```http
GET http://translation:8002/health
```

**Response `200`:** `{ "status": "ok", "model": "nllb-200-distilled-600M", "device": "cuda" }`

---

## 2. Speech Service (`/transcribe`)

**Port:** 8001
**Purpose:** Transcribe voice recordings using Whisper. Supports Indian languages.

### Transcribe Endpoint

```http
POST http://speech:8001/transcribe
Content-Type: multipart/form-data

file: <audio binary>
language: null
```

**Response `200`:**

```json
{
  "transcript": "एमजी रोड जंक्शन के पास बड़ा गड्ढा है",
  "transcript_en": "There is a big pothole near MG Road junction",
  "detected_language": "hi",
  "language_confidence": 0.95,
  "segments": [
    { "start": 0.0, "end": 2.5, "text": "एमजी रोड जंक्शन के पास" },
    { "start": 2.5, "end": 4.8, "text": "बड़ा गड्ढा है" }
  ],
  "duration_seconds": 4.8
}
```

**Notes:**
- Accepts: `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/m4a`, `audio/webm`.
- Max file size: 25 MB.
- If `language` is provided (ISO 639-1), skip auto-detection.
- `transcript_en` is the English translation of the transcript (piped through translation service internally).

### Health Check

```http
GET http://speech:8001/health
```

**Response `200`:** `{ "status": "ok", "model": "whisper-large-v3", "device": "cuda" }`

---

## 3. LLM Service (`/classify`, `/rag/generate`)

**Port:** 8003
**Purpose:** Classification, title generation, summarization, and RAG-based report generation.

### Classify Endpoint

```http
POST http://llm:8003/classify
Content-Type: application/json

{
  "text": "There is a big pothole near MG Road junction causing accidents. Need urgent repair.",
  "categories": ["roads", "water", "health", "education", "electricity", "sanitation", "public_transport", "other"],
  "description_en": null,
  "has_images": true
}
```

**Response `200`:**

```json
{
  "category": "roads",
  "category_confidence": 0.94,
  "all_scores": {
    "roads": 0.94,
    "water": 0.02,
    "health": 0.01,
    "sanitation": 0.01,
    "electricity": 0.01,
    "other": 0.01
  },
  "title": "Pothole on MG Road Needs Urgent Repair",
  "summary": "Citizen reports a large pothole near MG Road junction, causing traffic hazards and accidents. Urgent repair requested.",
  "summary_confidence": 0.87,
  "urgency_score": 0.82,
  "sentiment": "negative",
  "entities": [
    { "text": "MG Road", "type": "road", "confidence": 0.95 },
    { "text": "pothole", "type": "issue", "confidence": 0.98 }
  ]
}
```

### RAG Generate Endpoint

```http
POST http://llm:8003/rag/generate
Content-Type: application/json

{
  "query": "What are the most common road complaints in Ward 42?",
  "context": [
    { "id": "uuid1", "text": "...", "score": 0.92 },
    { "id": "uuid2", "text": "...", "score": 0.87 }
  ]
}
```

**Response `200`:**

```json
{
  "response": "Based on citizen reports, the most common road complaints in Ward 42 are potholes (45%), damaged speed bumps (22%), and poor drainage on roads (18%).",
  "citations": ["uuid1", "uuid2"],
  "confidence": 0.91
}
```

### Health Check

```http
GET http://llm:8003/health
```

**Response `200`:** `{ "status": "ok", "model": "mistral-7b-instruct", "device": "cuda" }`

---

## 4. Vision Service (`/analyze`)

**Port:** 8004
**Purpose:** Analyze uploaded images for visual context — detect infrastructure issues, garbage, waterlogging, etc.

### Analyze Endpoint

```http
POST http://vision:8004/analyze
Content-Type: multipart/form-data

file: <image binary>
category_hint: "roads"
```

**Response `200`:**

```json
{
  "detections": [
    { "label": "pothole", "confidence": 0.96, "bbox": [120, 340, 280, 450] },
    { "label": "road_damage", "confidence": 0.88, "bbox": [100, 300, 300, 500] }
  ],
  "scene_description": "A medium-sized pothole on an asphalt road with visible cracks radiating from it",
  "objects_detected": ["pothole", "car", "road_sign", "tree"],
  "has_relevant_issue": true,
  "issue_confidence": 0.94,
  "image_quality": { "blur_score": 0.05, "lighting": "good" }
}
```

**Notes:**
- Accepts: `image/jpeg`, `image/png`, `image/webp`.
- Max file size: 10 MB.
- `category_hint` is optional; if provided, focuses detection on relevant classes.
- Returns empty `detections` if no issue found (e.g., photo of a landscape with no infrastructure problem).

### Health Check

```http
GET http://vision:8004/health
```

**Response `200`:** `{ "status": "ok", "models": ["yolo11x-seg", "clip-vit-large"], "device": "cuda" }`

---

## 5. OCR Service (`/extract`)

**Port:** 8006
**Purpose:** Extract text from uploaded document images and photos containing text (signboards, handwritten notes, etc.).

### Extract Endpoint

```http
POST http://ocr:8006/extract
Content-Type: multipart/form-data

file: <image binary>
language: null
```

**Response `200`:**

```json
{
  "extracted_text": "निवासियों की समस्या: पानी की आपूर्ति ठीक नहीं है। कृपया ध्यान दें।",
  "extracted_text_en": "Residents' issue: Water supply is not working. Please take note.",
  "detected_language": "hi",
  "confidence": 0.92,
  "blocks": [
    {
      "text": "निवासियों की समस्या:",
      "bbox": [50, 40, 400, 80],
      "confidence": 0.95,
      "type": "heading"
    },
    {
      "text": "पानी की आपूर्ति ठीक नहीं है।",
      "bbox": [50, 100, 450, 140],
      "confidence": 0.91,
      "type": "paragraph"
    }
  ],
  "page_count": 1
}
```

**Notes:**
- Supports both printed and handwritten text in Indian languages.
- `language` hint: ISO 639-1 code or `null` for auto-detect.
- Accepts: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` (first page only).
- `extracted_text_en` is an English translation of the extracted text (piped through translation service internally).

### Health Check

```http
GET http://ocr:8006/health
```

**Response `200`:** `{ "status": "ok", "model": "paddleocr-v4", "device": "cuda" }`

---

## 6. Embeddings Service (`/embed`)

**Port:** 8005
**Purpose:** Generate vector embeddings for submissions to enable similarity search, duplicate detection, and RAG retrieval.

### Embed Endpoint

```http
POST http://embeddings:8005/embed
Content-Type: application/json

{
  "texts": ["There is a big pothole on MG Road junction causing accidents.",
            "Water supply is irregular in Ward 42 since last week."]
}
```

**Response `200`:**

```json
{
  "embeddings": [
    [0.0123, -0.0456, 0.0789, ...],
    [-0.0321, 0.0654, -0.0987, ...]
  ],
  "dimension": 768,
  "model": "intfloat/multilingual-e5-large-instruct",
  "normalized": true
}
```

**Notes:**
- Input texts should be in English (after translation).
- Returns normalized embeddings (L2 norm = 1).
- Dimension: 768 (for multilingual-e5-large).
- Used for: duplicate detection, similar complaint lookup, RAG retrieval.

### Health Check

```http
GET http://embeddings:8005/health
```

**Response `200`:** `{ "status": "ok", "model": "intfloat/multilingual-e5-large-instruct", "device": "cuda", "embedding_dim": 768 }`

---

## 7. Recommendation Service (`/rank`)

**Port:** 8007
**Purpose:** Rank submissions by priority/urgency for the MP Dashboard. Used for "hot issues" and resource allocation suggestions.

### Rank Endpoint

```http
POST http://recommendation:8007/rank
Content-Type: application/json

{
  "complaints": [
    {
      "id": "uuid1",
      "category": "roads",
      "urgency_score": 0.82,
      "citizen_count": 1,
      "days_open": 5,
      "ward": "Ward 42"
    },
    {
      "id": "uuid2",
      "category": "water",
      "urgency_score": 0.65,
      "citizen_count": 12,
      "days_open": 30,
      "ward": "Ward 15"
    }
  ],
  "ward_priorities": null
}
```

**Response `200`:**

```json
{
  "ranked_complaints": [
    {
      "id": "uuid2",
      "priority_score": 0.91,
      "priority_label": "critical",
      "reason": "High citizen count (12) and long duration (30 days) in water category"
    },
    {
      "id": "uuid1",
      "priority_score": 0.74,
      "priority_label": "high",
      "reason": "High urgency score with moderate duration"
    }
  ],
  "model_version": "xgboost-v2.1",
  "feature_importance": {
    "citizen_count": 0.35,
    "days_open": 0.28,
    "urgency_score": 0.22,
    "category_weight": 0.15
  }
}
```

### Health Check

```http
GET http://recommendation:8007/health
```

**Response `200`:** `{ "status": "ok", "model": "xgboost-v2.1", "device": "cpu" }`

---

## 8. Celery Task Orchestration

The Celery worker orchestrates the pipeline. Tasks are defined in `backend/api/app/tasks/`.

### Pipeline Task Flow

```python
# Pseudo-code: tasks/complaint_tasks.py

@celery.task(bind=True, max_retries=3, default_retry_delay=30)
def process_submission(self, complaint_id: str):
    """Main pipeline orchestrator."""

    complaint = get_complaint(complaint_id)
    update_status(complaint_id, "ai_processing")

    # Step 1: Voice transcription (if voice file attached)
    if complaint.voice_url:
        transcript = call_speech_service(complaint.voice_url)
        update_complaint(complaint_id, voice_transcript=transcript["transcript"])
        # Append to original description
        complaint.description += "\n" + transcript["transcript"]

    # Step 2: OCR (if document attached)
    if complaint.document_url:
        ocr_text = call_ocr_service(complaint.document_url)
        complaint.description += "\n" + ocr_text["extracted_text"]

    # Step 3: Translation (if not English)
    if is_non_english(complaint.description):
        translated = call_translation_service(complaint.description)
        update_complaint(
            complaint_id,
            description_en=translated["translated_text"],
            original_language=translated["detected_source_language"]
        )
    else:
        update_complaint(complaint_id, description_en=complaint.description, original_language="en")

    # Step 4: LLM classification + title + summary
    llm_result = call_llm_service(complaint.description_en or complaint.description)
    update_complaint(
        complaint_id,
        category=llm_result["category"],
        title=llm_result["title"],
        ai_summary=llm_result["summary"],
        ai_confidence=llm_result["category_confidence"]
    )

    # Step 5: Vision analysis (if images attached)
    if complaint.image_urls:
        vision_results = []
        for url in complaint.image_urls:
            result = call_vision_service(url, category_hint=llm_result["category"])
            vision_results.append(result)
        # Store aggregated vision results
        cache_vision_results(complaint_id, vision_results)

    # Step 6: Embedding generation
    embedding = call_embeddings_service([complaint.description_en])
    store_embedding(complaint_id, embedding["embeddings"][0])
    check_similar_complaints(complaint_id, embedding["embeddings"][0])

    # Step 7: Geotagging (reverse geocode)
    ward_info = reverse_geocode(complaint.latitude, complaint.longitude)
    update_complaint(complaint_id, ward=ward_info["ward"], constituency_id=ward_info["constituency_id"])

    # Step 8: Mark as analyzed
    update_status(complaint_id, "analyzed")

    # Step 9: Send notification to citizen
    send_notification(
        user_id=complaint.user_id,
        type="ai_analysis_complete",
        title="Analysis Complete",
        body=f"Your report '{complaint.title}' has been analyzed."
    )
```

### Task Queue Configuration

| Task | Queue | Priority | Timeout |
|------|-------|----------|---------|
| `process_submission` | `ai_pipeline` | High | 120s |
| `send_notification` | `notifications` | Normal | 30s |
| `generate_weekly_digest` | `scheduled` | Low | 300s |
| `cleanup_expired_tokens` | `maintenance` | Low | 60s |

---

## 9. Inter-Service Communication

### Service Discovery

In development, services communicate via Docker Compose service names:
- `http://translation:8002`
- `http://speech:8001`
- etc.

In production, services communicate via internal load balancer or Kubernetes service DNS.

### Retry & Circuit Breaker

```python
# Shared retry policy
AI_SERVICE_TIMEOUT = 10  # seconds
AI_SERVICE_MAX_RETRIES = 3
AI_SERVICE_RETRY_DELAY = 1  # exponential backoff

# Circuit breaker: if service fails 5 times in 60s, skip for 5 minutes
```

### Common Error Response Format

All AI services must return consistent errors:

```json
{
  "error": {
    "code": "TRANSLATION_FAILED",
    "message": "Failed to translate text",
    "details": { "text_length": 250, "detected_language": "unknown" }
  }
}
```

**Standard error codes:**

| Code | Meaning |
|------|---------|
| `MODEL_LOAD_FAILED` | Model failed to load on startup |
| `INFERENCE_TIMEOUT` | Inference took too long |
| `INVALID_INPUT` | Malformed request |
| `UNSUPPORTED_LANGUAGE` | Language not in supported set |
| `FILE_TOO_LARGE` | Input file exceeds limit |
| `UNSUPPORTED_FORMAT` | File format not supported |
| `OUT_OF_MEMORY` | GPU OOM during inference |

---

## 10. Shared Model: Submission Status & AI Metadata

The AI pipeline writes results back to the `complaints` table. Relevant columns:

```python
class Complaint(Base):
    # ... (see API spec for full schema)

    # AI Pipeline fields
    description_en: str | None       # ← Translation service
    original_language: str | None    # ← Translation service
    title: str | None                # ← LLM service
    ai_summary: str | None           # ← LLM service
    ai_confidence: float | None      # ← LLM service
    category: str                    # ← LLM service (may override user selection)
    voice_transcript: str | None     # ← Speech service
    ward: str | None                 # ← Geotagging (in-app logic)
    constituency_id: UUID | None     # ← Geotagging (in-app logic)

    # Result metadata
    pipeline_version: str | None     # "2.1.0" — which pipeline version ran
    pipeline_completed_at: datetime | None
    ai_services_used: list[str] | None  # ["translation", "speech", "llm", ...]
```

**Stretch goal:** Store per-service results in a separate `ai_results` JSONB column for audit/debugging.

---

## 11. MVP vs. Full Pipeline

For an MVP, the pipeline can be simplified:

| Step | MVP | Production |
|------|-----|------------|
| Translation | Skip (accept all languages as-is) | Required |
| Speech | Skip (text-only submissions) | Required |
| OCR | Skip (document upload optional) | Required |
| LLM Classification | Required (lightweight model, CPU) | Required (GPU) |
| LLM Title/Summary | Required | Required |
| Vision | Skip | Required |
| Embeddings | Skip | Required |
| Recommendation | Skip | Required |
| Geotagging | Simple ward lookup by lat/lng | Full reverse-geocode |

**MVP Task Flow:**

```
Submission Created → LLM Classification & Title → Geocode → Status: analyzed
```

---

## 12. Environment Variables

Each AI service requires:

| Variable | Example | Description |
|----------|---------|-------------|
| `MODEL_CACHE_DIR` | `/models` | Where models are cached |
| `HF_TOKEN` | `hf_...` | HuggingFace token (for gated models) |
| `CUDA_VISIBLE_DEVICES` | `0` | GPU device ID |
| `MAX_BATCH_SIZE` | `16` | Max batch for inference |
| `LOG_LEVEL` | `INFO` | Logging level |
| `SENTRY_DSN` | `https://...` | Error tracking |

Services that need network access to the translation service (speech, OCR) also need:

| Variable | Example | Description |
|----------|---------|-------------|
| `TRANSLATION_SERVICE_URL` | `http://translation:8002` | Internal URL |

---

## 13. Docker Compose Integration (Development)

From `docker-compose.prod.yml`:

```yaml
version: "3.9"
services:
  api: { ... }
  worker:
    build: ./backend/worker
    depends_on: [redis, api]
    environment:
      - AI_SERVICES_BASE_URL=http://ai-services:8000
  speech:    { build: ./backend/ai-services/speech,    ports: ["8001:8001"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  translation: { build: ./backend/ai-services/translation, ports: ["8002:8002"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  llm:       { build: ./backend/ai-services/llm,       ports: ["8003:8003"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  vision:    { build: ./backend/ai-services/vision,    ports: ["8004:8004"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  embeddings:{ build: ./backend/ai-services/embeddings, ports: ["8005:8005"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  ocr:       { build: ./backend/ai-services/ocr,       ports: ["8006:8006"], deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1 }] } } } }
  recommendation:{ build: ./backend/ai-services/recommendation, ports: ["8007:8007"] }
```

