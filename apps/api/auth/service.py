from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from auth.models import User, WebAuthnCredential
from core.database import get_db
from fastapi import Depends, HTTPException
import uuid
import base64


class AuthService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def create_user_with_credential(
        self,
        username: str,
        credential_id: bytes,
        public_key: bytes,
        sign_count: int,
    ) -> User:
        user = User(username=username)
        self.db.add(user)
        await self.db.flush()

        cred = WebAuthnCredential(
            user_id=user.id,
            credential_id=base64.urlsafe_b64encode(credential_id).rstrip(b'=').decode(),
            public_key=public_key,
            sign_count=sign_count,
        )
        self.db.add(cred)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(status_code=409, detail="Username already taken. Please sign in instead.")
        await self.db.refresh(user)
        return user

    async def get_credential(self, credential_id_hex: str) -> WebAuthnCredential | None:
        result = await self.db.execute(
            select(WebAuthnCredential).where(
                WebAuthnCredential.credential_id == credential_id_hex
            )
        )
        return result.scalar_one_or_none()

    async def update_sign_count(self, credential_uuid: uuid.UUID, new_count: int):
        cred = await self.db.get(WebAuthnCredential, credential_uuid)
        if cred:
            cred.sign_count = new_count
            await self.db.commit()
