import logging
import torch
from fastapi import FastAPI, HTTPException
from transformers import AutoTokenizer, AutoModelForCausalLM
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Service", version="1.0.0")

_model = None
_tokenizer = None
_device = None

CATEGORIES = ["roads", "water", "health", "education", "electricity", "sanitation", "public_transport", "other"]

def get_device():
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device

def get_model():
    global _model, _tokenizer
    if _model is None:
        model_name = "microsoft/Phi-3-mini-4k-instruct"
        logger.info(f"Loading LLM model {model_name} on {get_device()}...")
        _tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        _model = AutoModelForCausalLM.from_pretrained(
            model_name, trust_remote_code=True, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        ).to(get_device())
        logger.info("LLM model loaded")
    return _model, _tokenizer

def extract_json_from_text(text: str) -> dict:
    try:
        import json
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {}

@app.post("/classify")
async def classify(body: dict):
    try:
        text = body.get("text", "")
        categories = body.get("categories", CATEGORIES)

        if not text.strip():
            return {
                "category": "other",
                "category_confidence": 0.0,
                "all_scores": {c: 0.0 for c in categories},
                "title": "",
                "summary": "",
                "summary_confidence": 0.0,
                "urgency_score": 0.0,
                "sentiment": "neutral",
                "entities": [],
            }

        model, tokenizer = get_model()

        prompt = f"""Analyze this citizen complaint and return JSON with:
- category: one of {categories}
- category_confidence: 0.0-1.0
- title: short title under 10 words
- summary: 1-2 sentence summary
- urgency_score: 0.0-1.0
- sentiment: positive/negative/neutral

Complaint: {text[:2000]}

Response:"""

        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(get_device())

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.1,
                do_sample=True,
            )

        response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        result = extract_json_from_text(response)

        return {
            "category": result.get("category", "other"),
            "category_confidence": result.get("category_confidence", 0.0),
            "all_scores": {c: result.get("category_confidence", 0.0) if c == result.get("category") else 0.0 for c in categories},
            "title": result.get("title", "Citizen Complaint"),
            "summary": result.get("summary", text[:200]),
            "summary_confidence": result.get("category_confidence", 0.0),
            "urgency_score": result.get("urgency_score", 0.5),
            "sentiment": result.get("sentiment", "neutral"),
            "entities": result.get("entities", []),
        }
    except Exception as e:
        logger.exception("Classification failed")
        text_lower = body.get("text", "").lower()
        category = "other"
        for c in ["roads", "water", "health", "education", "electricity", "sanitation"]:
            if c in text_lower:
                category = c
                break
        return {
            "category": category,
            "category_confidence": 0.5,
            "all_scores": {c: 0.5 if c == category else 0.0 for c in (body.get("categories", CATEGORIES))},
            "title": "Citizen Complaint",
            "summary": body.get("text", "")[:200],
            "summary_confidence": 0.5,
            "urgency_score": 0.5,
            "sentiment": "neutral",
            "entities": [],
        }

@app.post("/rag/generate")
async def rag_generate(body: dict):
    try:
        query = body.get("query", "")
        context = body.get("context", [])

        context_text = "\n".join([f"- {c.get('text', '')}" for c in context[:5]])

        model, tokenizer = get_model()

        prompt = f"""Answer the question based on the context provided.

Context:
{context_text}

Question: {query}

Answer:"""

        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(get_device())

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.1,
                do_sample=True,
            )

        response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True).strip()

        return {
            "response": response or "I don't have enough information to answer that question.",
            "citations": [c.get("id") for c in context[:3]],
            "confidence": 0.7,
        }
    except Exception as e:
        logger.exception("RAG generation failed")
        return {"response": "Unable to generate response.", "citations": [], "confidence": 0.0}

@app.get("/health")
async def health():
    return {"status": "ok", "model": "Phi-3-mini-4k-instruct", "device": get_device()}
