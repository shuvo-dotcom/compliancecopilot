from agents.llm_client import LLMClient
from storage.documents import download_document
import pypdf
import io


class ChunkerAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            doc_bytes = await download_document(state["document_path"])
            text = self._extract_text(doc_bytes, state["document_path"])
            chunks = self._split_into_chunks(text, chunk_size=1000, overlap=100)
            return {**state, "chunks": chunks, "status": "chunked"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"ChunkerAgent: {e}"}

    def _extract_text(self, doc_bytes: bytes, path: str) -> str:
        if path.lower().endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(doc_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        if path.lower().endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(doc_bytes))
            return "\n".join(p.text for p in doc.paragraphs)
        return doc_bytes.decode("utf-8", errors="replace")

    def _split_into_chunks(self, text: str, chunk_size: int, overlap: int) -> list[dict]:
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i : i + chunk_size]
            chunks.append({
                "content": " ".join(chunk_words),
                "metadata": {"start_word": i, "end_word": i + len(chunk_words)},
            })
            i += chunk_size - overlap
        return chunks
