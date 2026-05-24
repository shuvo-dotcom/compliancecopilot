import yaml
import os
from agents.llm_client import LLMClient
from storage.embeddings import embed_texts, similarity_search

FRAMEWORKS_DIR = os.path.join(os.path.dirname(__file__), "..", "frameworks")


class RetrieverAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            framework = self._load_framework(state["framework"])
            requirements = framework.get("requirements", [])

            retrieved = []
            for req in requirements:
                # Build a natural-language query from the requirement
                query = self._build_query(req)

                # Embed the query using the same local model as the chunks
                [query_embedding] = await embed_texts([query])

                # Cosine similarity search against stored chunk vectors
                relevant_chunks = await similarity_search(
                    job_id=state["job_id"],
                    query_embedding=query_embedding,
                    top_k=5,
                )

                retrieved.append({
                    "requirement": req,
                    "relevant_chunks": relevant_chunks,
                })

            return {**state, "retrieved_clauses": retrieved, "status": "retrieved"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"RetrieverAgent: {e}"}

    def _load_framework(self, framework_id: str) -> dict:
        path = os.path.join(FRAMEWORKS_DIR, f"{framework_id}.yaml")
        with open(path) as f:
            return yaml.safe_load(f)

    def _build_query(self, requirement: dict) -> str:
        """Compose a rich natural-language query from the requirement metadata
        so the embedding captures the full semantic intent."""
        parts = [
            requirement.get("title", ""),
            requirement.get("description", ""),
        ]
        checks = requirement.get("checks", [])
        if checks:
            parts.append("Checks: " + " ".join(checks))
        return " ".join(p for p in parts if p)
