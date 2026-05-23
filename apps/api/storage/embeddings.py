from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from core.database import Base, AsyncSessionLocal
import uuid
import json


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(String, nullable=False, index=True)
    chunk_index = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    metadata_ = Column("metadata", Text, nullable=True)


async def store_chunks(job_id: str, chunks: list[dict]):
    async with AsyncSessionLocal() as session:
        for i, chunk in enumerate(chunks):
            doc_chunk = DocumentChunk(
                job_id=job_id,
                chunk_index=str(i),
                content=chunk.get("content", ""),
                metadata_=json.dumps(chunk.get("metadata", {})),
            )
            session.add(doc_chunk)
        await session.commit()


async def similarity_search(job_id: str, query_embedding: list[float], top_k: int = 10) -> list[dict]:
    async with AsyncSessionLocal() as session:
        from sqlalchemy import text
        result = await session.execute(
            text("""
                SELECT content, metadata, 1 - (embedding <=> :embedding) AS similarity
                FROM document_chunks
                WHERE job_id = :job_id AND embedding IS NOT NULL
                ORDER BY embedding <=> :embedding
                LIMIT :top_k
            """),
            {
                "embedding": str(query_embedding),
                "job_id": job_id,
                "top_k": top_k,
            },
        )
        rows = result.fetchall()
        return [
            {"content": row.content, "metadata": json.loads(row.metadata or "{}"), "similarity": row.similarity}
            for row in rows
        ]
