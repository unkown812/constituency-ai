from qdrant_client import QdrantClient, models
from app.core.config import settings

qdrant_client: QdrantClient | None = None

def get_qdrant() -> QdrantClient:
    global qdrant_client
    if qdrant_client is None:
        qdrant_client = QdrantClient(url=settings.qdrant_url)
    return qdrant_client

async def ensure_collection():
    client = get_qdrant()
    collections = client.get_collections().collections
    if not any(c.name == settings.qdrant_collection for c in collections):
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=models.VectorParams(
                size=settings.embedding_dim,
                distance=models.Distance.COSINE,
            ),
        )
