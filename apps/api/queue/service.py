from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jobs.models import Job, JobStatus
from fastapi import Depends
from core.database import get_db
import uuid


class QueueService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def list_pending(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Job).where(
                Job.user_id == uuid.UUID(user_id),
                Job.status == JobStatus.awaiting_review,
            ).order_by(Job.created_at.desc())
        )
        jobs = result.scalars().all()
        return [self._serialize(j) for j in jobs]

    async def approve(self, job_id: str, user_id: str) -> dict:
        job = await self._get_owned_job(job_id, user_id)
        job.status = JobStatus.approved
        from datetime import datetime
        job.completed_at = datetime.utcnow()
        await self.db.commit()
        return {"status": "approved", "job_id": job_id}

    async def reject(self, job_id: str, user_id: str) -> dict:
        job = await self._get_owned_job(job_id, user_id)
        job.status = JobStatus.rejected
        await self.db.commit()
        return {"status": "rejected", "job_id": job_id}

    async def edit_finding(self, job_id: str, finding_id: str, body: dict, user_id: str) -> dict:
        job = await self._get_owned_job(job_id, user_id)
        findings = job.findings or {}
        finding_list = findings.get("findings", [])

        for i, f in enumerate(finding_list):
            if f.get("requirement_id") == finding_id:
                finding_list[i] = {**f, **body}
                break

        job.findings = {**findings, "findings": finding_list}
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(job, "findings")
        await self.db.commit()
        return {"status": "updated", "finding_id": finding_id}

    async def _get_owned_job(self, job_id: str, user_id: str) -> Job:
        from fastapi import HTTPException
        result = await self.db.execute(
            select(Job).where(Job.id == uuid.UUID(job_id), Job.user_id == uuid.UUID(user_id))
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job

    def _serialize(self, job: Job) -> dict:
        return {
            "id": str(job.id),
            "document_name": job.document_name,
            "framework": job.framework,
            "status": job.status.value,
            "findings": job.findings,
            "created_at": job.created_at.isoformat(),
        }
