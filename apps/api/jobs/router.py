from typing import cast
from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from jobs.service import JobService
from jobs.pdf_export import generate_pdf
from agents.orchestrator import run_compliance_job
import asyncio
import io

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_llm_key(request: Request) -> tuple[str, str]:
    api_key = request.headers.get("X-LLM-Key")
    model = request.headers.get("X-LLM-Model", "gpt-4o")
    if not api_key:
        raise HTTPException(status_code=400, detail="LLM key missing from request headers.")
    return api_key, model


@router.post("/")
async def create_job(
    request: Request,
    file: UploadFile = File(...),
    framework: str = Form(...),
    service: JobService = Depends(),
):
    api_key, model = get_llm_key(request)
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    job = await service.create_job(
        user_id=user_id,
        file=file,
        framework=framework,
        model=model,
    )

    asyncio.create_task(
        run_compliance_job(
            job_id=str(job.id),
            document_path=cast(str, job.document_path),
            framework=framework,
            api_key=api_key,
            model=model,
        )
    )

    return {"job_id": str(job.id), "status": "queued"}


@router.get("/")
async def list_jobs(request: Request, service: JobService = Depends()):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await service.list_jobs(user_id)


@router.get("/{job_id}")
async def get_job(job_id: str, request: Request, service: JobService = Depends()):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    job = await service.get_job(job_id, user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/export/pdf")
async def export_pdf(job_id: str, request: Request, service: JobService = Depends()):
    """Generate and stream a PDF report. Only available for approved jobs."""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    job = await service.get_job(job_id, user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") not in ("approved", "awaiting_review"):
        raise HTTPException(status_code=400, detail="Report not ready for export.")
    if not job.get("findings"):
        raise HTTPException(status_code=400, detail="No findings to export.")

    pdf_bytes = generate_pdf(job["findings"], job["document_name"])
    filename = f"compliance-report-{job_id[:8]}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
