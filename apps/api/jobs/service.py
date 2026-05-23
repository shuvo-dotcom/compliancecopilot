from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jobs.models import Job, JobStatus
from storage.documents import upload_document
from fastapi import Depends, UploadFile
from core.database import get_db
import uuid
import json


class JobService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def create_job(
        self,
        user_id: str,
        file: UploadFile,
        framework: str,
        model: str,
    ) -> Job:
        file_bytes = await file.read()
        document_path = await upload_document(
            file_bytes, file.filename or "upload", file.content_type or "application/octet-stream"
        )

        job = Job(
            user_id=uuid.UUID(user_id),
            document_name=file.filename or "upload",
            document_path=document_path,
            framework=framework,
            model=model,
            status=JobStatus.queued,
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def list_jobs(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Job)
            .where(Job.user_id == uuid.UUID(user_id))
            .order_by(Job.created_at.desc())
        )
        jobs = result.scalars().all()
        return [self._serialize(j) for j in jobs]

    async def get_job(self, job_id: str, user_id: str) -> dict | None:
        result = await self.db.execute(
            select(Job).where(Job.id == uuid.UUID(job_id), Job.user_id == uuid.UUID(user_id))
        )
        job = result.scalar_one_or_none()
        return self._serialize(job) if job else None

    async def update_status(self, job_id: str, status: JobStatus, error: str | None = None):
        job = await self.db.get(Job, uuid.UUID(job_id))
        if job:
            job.status = status
            if status in (JobStatus.approved, JobStatus.failed):
                from datetime import datetime
                job.completed_at = datetime.utcnow()
            await self.db.commit()

    async def save_report(self, job_id: str, report: dict):
        job = await self.db.get(Job, uuid.UUID(job_id))
        if job:
            job.findings = report
            await self.db.commit()

    def _serialize(self, job: Job) -> dict:
        return {
            "id": str(job.id),
            "document_name": job.document_name,
            "framework": job.framework,
            "model": job.model,
            "status": job.status.value,
            "findings": job.findings,
            "created_at": job.created_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
