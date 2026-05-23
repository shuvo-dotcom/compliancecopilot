from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base
import uuid
from datetime import datetime
import enum


class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    awaiting_review = "awaiting_review"
    approved = "approved"
    rejected = "rejected"
    failed = "failed"


class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_name = Column(String, nullable=False)
    document_path = Column(String, nullable=False)  # MinIO object path
    framework = Column(String, nullable=False)       # gdpr, eu_ai_act
    model = Column(String, nullable=False)           # e.g. gpt-4o
    status = Column(Enum(JobStatus), default=JobStatus.queued)
    findings = Column(JSON, nullable=True)           # structured gap report
    report_path = Column(String, nullable=True)      # MinIO path to PDF report
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    # NOTE: LLM API key is NOT stored here. it comes from the request header.
