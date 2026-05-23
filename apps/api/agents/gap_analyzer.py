import json
from agents.llm_client import LLMClient


class GapAnalyzerAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            findings = []
            for clause in state["retrieved_clauses"]:
                req = clause["requirement"]
                context = "\n\n".join(c["content"] for c in clause["relevant_chunks"])

                finding = await self._analyze(req, context)
                findings.append(finding)

            return {**state, "findings": findings, "status": "analyzed"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"GapAnalyzerAgent: {e}"}

    async def _analyze(self, requirement: dict, context: str) -> dict:
        checks_str = "\n".join(f"- {c}" for c in requirement.get("checks", []))
        prompt = f"""You are a compliance expert. Analyze whether the policy document addresses the following requirement.

Requirement: {requirement['title']} ({requirement['article']})
Description: {requirement['description']}

Checks to perform:
{checks_str}

Relevant policy excerpts:
{context[:3000]}

For each check, determine if it is: COMPLIANT, PARTIAL, or MISSING.
Return a JSON object with this structure:
{{
  "requirement_id": "{requirement['id']}",
  "article": "{requirement['article']}",
  "title": "{requirement['title']}",
  "severity": "{requirement['severity']}",
  "overall_status": "compliant|partial|gap",
  "check_results": [
    {{"check": "check text", "status": "compliant|partial|missing", "explanation": "brief explanation", "evidence": "quote from document if found"}}
  ],
  "summary": "one paragraph summary of compliance status"
}}"""

        response = await self.llm.complete(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2048,
        )

        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            return json.loads(response[start:end])
        except Exception:
            return {
                "requirement_id": requirement["id"],
                "article": requirement["article"],
                "title": requirement["title"],
                "severity": requirement["severity"],
                "overall_status": "gap",
                "check_results": [],
                "summary": f"Analysis failed: {response[:200]}",
            }
