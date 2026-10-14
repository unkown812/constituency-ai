import logging
import torch
from fastapi import FastAPI, HTTPException
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Embeddings Service", version="1.0.0")

_model = None
_device = None
_model_name = "intfloat/multilingual-e5-large-instruct"
_dimension = 768

def get_device():
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device

def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading embedding model {_model_name} on {get_device()}...")
        _model = SentenceTransformer(_model_name, device=get_device())
        logger.info("Embedding model loaded")
    return _model

@app.post("/embed")
async def embed(body: dict):
    try:
        texts = body.get("texts", [])
        if not texts:
            return {"embeddings": [], "dimension": _dimension, "model": _model_name, "normalized": True}

        model = get_model()

        prefixed = [f"query: {t}" if len(texts) > 1 else t for t in texts]

        embeddings = model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)

        return {
            "embeddings": embeddings.tolist() if hasattr(embeddings, 'tolist') else embeddings,
            "dimension": _dimension,
            "model": _model_name,
            "normalized": True,
        }
    except Exception as e:
        logger.exception("Embedding failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "EMBEDDING_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": _model_name,
        "device": get_device(),
        "embedding_dim": _dimension,
    }
