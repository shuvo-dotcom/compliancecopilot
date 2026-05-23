from datetime import datetime
from agents.llm_client import LLMClient


class ReportWriterAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            findings = state["scored_findings"]
            executive_summary = await self._write_executive_summary(findings, state["framework"])

            total = len(findings)
            compliant = sum(1 for f in findings if f.get("overall_status") == "compliant")
            partial = sum(1 for f in findings if f.get("overall_status") == "partial")
            gaps = sum(1 for f in findings if f.get("overall_status") == "gap")
            avg_risk = round(sum(f.get("risk_score", 0) for f in findings) / total) if total else 0

            report = {
                "job_id": state["job_id"],
                "framework": state["framework"],
                "generated_at": datetime.utcnow().isoformat(),
                "summary": {
                    "total_requirements": total,
                    "compliant": compliant,
                    "partial": partial,
                    "gaps": gaps,
                    "average_risk_score": avg_risk,
                    "compliance_percentage": round(compliant / total * 100) if total else 0,
                },
                "executive_summary": executive_summary,
                "findings": findings,
            }

            return {**state, "report": report, "status": "awaiting_review"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"ReportWriterAgent: {e}"}

    async def _write_executive_summary(self, findings: list[dict], framework: str) -> str:
        gap_titles = [f["title"] for f in findings if f.get("overall_status") == "gap"]
        partial_titles = [f["title"] for f in findings if f.get("overall_status") == "partial"]
        high_risk = [f for f in findings if f.get("risk_score", 0) >= 70]

        prompt = f"""Write a concise executive summary (3-4 paragraphs) of a compliance gap analysis report for the {framework.upper()} framework.

Key gaps identified: {', '.join(gap_titles) or 'None'}
Partial compliance areas: {', '.join(partial_titles) or 'None'}
High-risk findings count: {len(high_risk)}

The summary should be professional, highlight the most critical issues, and recommend immediate actions."""

        return await self.llm.complete(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=512,
        )
