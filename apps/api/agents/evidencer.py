import json
from agents.llm_client import LLMClient


class EvidencerAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            evidenced = []
            for finding in state["findings"]:
                enriched = await self._add_evidence(finding, state["chunks"])
                evidenced.append(enriched)
            return {**state, "evidenced_findings": evidenced, "status": "evidenced"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"EvidencerAgent: {e}"}

    async def _add_evidence(self, finding: dict, chunks: list[dict]) -> dict:
        gap_checks = [
            cr for cr in finding.get("check_results", [])
            if cr.get("status") in ("missing", "partial")
        ]
        if not gap_checks:
            return {**finding, "citations": []}

        checks_str = "\n".join(f"- {cr['check']}" for cr in gap_checks)
        all_text = "\n\n".join(c["content"] for c in chunks[:20])

        prompt = f"""You are a compliance evidence specialist. For each gap or partial finding, locate the most relevant passage in the document that partially addresses the requirement, or confirm it is completely absent.

Gaps found:
{checks_str}

Document text (excerpt):
{all_text[:4000]}

Return JSON array:
[
  {{
    "check": "check text",
    "citation": "exact quote from document or null if absent",
    "page_hint": "approximate location description"
  }}
]"""

        response = await self.llm.complete(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=1024,
        )

        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            citations = json.loads(response[start:end])
        except Exception:
            citations = []

        return {**finding, "citations": citations}
