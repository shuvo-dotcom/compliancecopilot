import uuid
import json
from typing import cast
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
)
from core.config import settings
from auth.service import AuthService
import base64

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/begin")
async def register_begin(request: Request):
    body = await request.json()
    username = body.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    options = generate_registration_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        rp_name=settings.WEBAUTHN_RP_NAME,
        user_name=username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
    )
    request.session["registration_challenge"] = base64.b64encode(options.challenge).decode()
    request.session["username"] = username

    from webauthn.helpers import options_to_json
    return JSONResponse(content=json.loads(options_to_json(options)))


@router.post("/register/complete")
async def register_complete(request: Request, service: AuthService = Depends()):
    body = await request.json()
    challenge_b64 = request.session.get("registration_challenge")
    username = request.session.get("username")

    if not challenge_b64 or not username:
        raise HTTPException(status_code=400, detail="No active registration session")

    challenge = base64.b64decode(challenge_b64)

    verification = verify_registration_response(
        credential=body,
        expected_challenge=challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
    )

    user = await service.create_user_with_credential(
        username=username,
        credential_id=verification.credential_id,
        public_key=verification.credential_public_key,
        sign_count=verification.sign_count,
    )
    request.session.pop("registration_challenge", None)
    request.session.pop("username", None)
    return {"status": "registered", "userId": str(user.id)}


@router.post("/login/begin")
async def login_begin(request: Request):
    options = generate_authentication_options(
        rp_id=settings.WEBAUTHN_RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    request.session["auth_challenge"] = base64.b64encode(options.challenge).decode()

    from webauthn.helpers import options_to_json
    return JSONResponse(content=json.loads(options_to_json(options)))


@router.post("/login/complete")
async def login_complete(request: Request, service: AuthService = Depends()):
    body = await request.json()
    challenge_b64 = request.session.get("auth_challenge")
    if not challenge_b64:
        raise HTTPException(status_code=400, detail="No active auth session")

    challenge = base64.b64decode(challenge_b64)

    raw_id = body.get("rawId") or body.get("id")
    credential = await service.get_credential(raw_id)
    if not credential:
        raise HTTPException(status_code=401, detail="Credential not found")

    verification = verify_authentication_response(
        credential=body,
        expected_challenge=challenge,
        expected_rp_id=settings.WEBAUTHN_RP_ID,
        expected_origin=settings.WEBAUTHN_ORIGIN,
        credential_public_key=cast(bytes, credential.public_key),
        credential_current_sign_count=cast(int, credential.sign_count),
    )

    await service.update_sign_count(cast(uuid.UUID, credential.id), verification.new_sign_count)
    request.session["user_id"] = str(credential.user_id)
    request.session.pop("auth_challenge", None)
    return {"status": "authenticated"}


@router.post("/machine-token")
async def machine_token(request: Request, service: AuthService = Depends()):
    """
    Generate a one-time 60-second token for the native Mac app.
    Only works from localhost. Redeemed once, then deleted.
    No password, no OAuth — just a local machine handshake.
    """
    token = await service.create_machine_token()
    return {"token": token}


@router.post("/redeem-machine-token")
async def redeem_machine_token(request: Request, service: AuthService = Depends()):
    """Redeem a machine token for a real session. Token is deleted on use."""
    body = await request.json()
    token = body.get("token")
    user_id = await service.redeem_machine_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    request.session["user_id"] = user_id
    return {"status": "authenticated"}


@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"status": "logged_out"}


@router.get("/me")
async def me(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"userId": user_id}
