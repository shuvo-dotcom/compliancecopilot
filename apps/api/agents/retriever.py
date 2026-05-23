import json
import yaml
import os
from agents.llm_client import LLMClient


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
                relevant_chunks = self._keyword_search(state["chunks"], req)
                retrieved.append({
                    "requirement": req,
                    "relevant_chunks": relevant_chunks[:5],
                })

            return {**state, "retrieved_clauses": retrieved, "status": "retrieved"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"RetrieverAgent: {e}"}

    def _load_framework(self, framework_id: str) -> dict:
        path = os.path.join(FRAMEWORKS_DIR, f"{framework_id}.yaml")
        with open(path) as f:
            return yaml.safe_load(f)

    def _keyword_search(self, chunks: list[dict], requirement: dict) -> list[dict]:
        keywords = set()
        for check in requirement.get("checks", []):
            keywords.update(check.lower().split())
        keywords.update(requirement.get("title", "").lower().split())

        scored = []
        for chunk in chunks:
            content_lower = chunk["content"].lower()
            score = sum(1 for kw in keywords if kw in content_lower)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored]
