from sqlalchemy import Column, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from core.database import Base, AsyncSessionLocal
import uuid
import json
import asyncio
from functools import lru_cache
from typing import List

VECTOR_DIM = 384  # BAAI/bge-small-en-v1.5 output dimension


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(String, nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(VECTOR_DIM), nullable=True)
    metadata_ = Column("metadata", Text, nullable=True)


@lru_cache(maxsize=1)
def _get_embed_model():
    """Load fastembed model once — cached for the process lifetime.
    Downloads ~130 MB ONNX model on first call, then runs locally."""
    from fastembed import TextEmbedding
    return TextEmbedding(model_name="BAAI/bge-small-en-v1.5")


def _embed_sync(texts: List[str]) -> List[List[float]]:
    model = _get_embed_model()
    return [e.tolist() for e in model.embed(texts)]


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Run embedding in a thread pool so it doesn't block the async event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _embed_sync, texts)


async def store_chunks(job_id: str, chunks: List[dict], embeddings: List[List[float]]):
    """Persist chunks + their vector embeddings to pgvector."""
    async with AsyncSessionLocal() as session:
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            doc_chunk = DocumentChunk(
                job_id=job_id,
                chunk_index=i,
                content=chunk.get("content", ""),
                embedding=emb,
                metadata_=json.dumps(chunk.get("metadata", {})),
            )
            session.add(doc_chunk)
        await session.commit()


async def similarity_search(
    job_id: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[dict]:
    """Return top-k chunks closest to query_embedding by cosine distance."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import text
        # Cast embedding to vector in a subquery to avoid asyncpg parameter
        # substitution conflicts with the ::vector syntax
        emb_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
        result = await session.execute(
            text(f"""
                SELECT content, metadata,
                       1 - (embedding <=> '{emb_str}'::vector) AS similarity
                FROM document_chunks
                WHERE job_id = :job_id AND embedding IS NOT NULL
                ORDER BY embedding <=> '{emb_str}'::vector
                LIMIT :top_k
            """),
            {"job_id": job_id, "top_k": top_k},
        )
        rows = result.fetchall()
        return [
            {
                "content": row.content,
                "metadata": json.loads(row.metadata or "{}"),
                "similarity": float(row.similarity),
            }
            for row in rows
        ]
