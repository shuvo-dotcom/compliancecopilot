from langgraph.graph import StateGraph, END
from typing import TypedDict
from agents.llm_client import LLMClient
from agents.chunker import ChunkerAgent
from agents.retriever import RetrieverAgent
from agents.gap_analyzer import GapAnalyzerAgent
from agents.evidencer import EvidencerAgent
from agents.risk_scorer import RiskScorerAgent
from agents.report_writer import ReportWriterAgent


class ComplianceState(TypedDict):
    job_id: str
    document_path: str
    framework: str
    chunks: list[dict]
    embeddings: list
    retrieved_clauses: list[dict]
    findings: list[dict]
    evidenced_findings: list[dict]
    scored_findings: list[dict]
    report: dict
    status: str
    error: str | None


def build_graph(llm_client: LLMClient) -> StateGraph:
    """
    Build the LangGraph compliance pipeline.
    llm_client is injected per-job with the user's session key.
    """
    chunker = ChunkerAgent(llm_client)
    retriever = RetrieverAgent(llm_client)
    gap_analyzer = GapAnalyzerAgent(llm_client)
    evidencer = EvidencerAgent(llm_client)
    risk_scorer = RiskScorerAgent(llm_client)
    report_writer = ReportWriterAgent(llm_client)

    graph = StateGraph(ComplianceState)

    graph.add_node("chunk", chunker.run)
    graph.add_node("retrieve", retriever.run)
    graph.add_node("analyze", gap_analyzer.run)
    graph.add_node("evidence", evidencer.run)
    graph.add_node("score", risk_scorer.run)
    graph.add_node("write_report", report_writer.run)

    graph.set_entry_point("chunk")
    graph.add_edge("chunk", "retrieve")
    graph.add_edge("retrieve", "analyze")
    graph.add_edge("analyze", "evidence")
    graph.add_edge("evidence", "score")
    graph.add_edge("score", "write_report")
    graph.add_edge("write_report", END)

    return graph.compile()


async def run_compliance_job(
    job_id: str,
    document_path: str,
    framework: str,
    api_key: str,
    model: str,
) -> dict:
    from jobs.service import JobService
    from core.database import AsyncSessionLocal
    from jobs.models import JobStatus

    llm_client = LLMClient.from_request(api_key=api_key, model=model)
    graph = build_graph(llm_client)

    initial_state = ComplianceState(
        job_id=job_id,
        document_path=document_path,
        framework=framework,
        chunks=[],
        embeddings=[],
        retrieved_clauses=[],
        findings=[],
        evidenced_findings=[],
        scored_findings=[],
        report={},
        status="running",
        error=None,
    )

    async with AsyncSessionLocal() as db:
        service = JobService(db)
        await service.update_status(job_id, JobStatus.running)

    try:
        result = await graph.ainvoke(initial_state)

        async with AsyncSessionLocal() as db:
            service = JobService(db)
            if result.get("status") == "failed":
                await service.update_status(job_id, JobStatus.failed, error=result.get("error"))
            else:
                await service.save_report(job_id, result["report"])
                await service.update_status(job_id, JobStatus.awaiting_review)

        return result
    except Exception as e:
        async with AsyncSessionLocal() as db:
            service = JobService(db)
            await service.update_status(job_id, JobStatus.failed, error=str(e))
        raise
