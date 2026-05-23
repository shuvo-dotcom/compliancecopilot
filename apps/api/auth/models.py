from sqlalchemy import Column, String, Integer, DateTime, LargeBinary, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base
import uuid
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    credential_id = Column(String, unique=True, nullable=False)
    public_key = Column(LargeBinary, nullable=False)  # public key only
    sign_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    # NOTE: no password, no LLM key, no sensitive data stored here. ever.
