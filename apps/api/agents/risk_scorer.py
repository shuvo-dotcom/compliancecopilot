import json
from agents.llm_client import LLMClient


SEVERITY_WEIGHTS = {"critical": 10, "high": 7, "medium": 4, "low": 1}
STATUS_WEIGHTS = {"gap": 1.0, "partial": 0.5, "compliant": 0.0}


class RiskScorerAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def run(self, state: dict) -> dict:
        try:
            scored = []
            for finding in state["evidenced_findings"]:
                scored.append(self._score(finding))
            return {**state, "scored_findings": scored, "status": "scored"}
        except Exception as e:
            return {**state, "status": "failed", "error": f"RiskScorerAgent: {e}"}

    def _score(self, finding: dict) -> dict:
        severity = finding.get("severity", "medium")
        status = finding.get("overall_status", "gap")

        weight = SEVERITY_WEIGHTS.get(severity, 4)
        status_factor = STATUS_WEIGHTS.get(status, 1.0)
        risk_score = round(weight * status_factor * 10)  # 0-100

        check_results = finding.get("check_results", [])
        missing_count = sum(1 for cr in check_results if cr.get("status") == "missing")
        partial_count = sum(1 for cr in check_results if cr.get("status") == "partial")

        return {
            **finding,
            "risk_score": risk_score,
            "missing_checks": missing_count,
            "partial_checks": partial_count,
            "remediation_priority": self._priority(risk_score),
        }

    def _priority(self, score: int) -> str:
        if score >= 70:
            return "immediate"
        if score >= 40:
            return "high"
        if score >= 20:
            return "medium"
        return "low"
