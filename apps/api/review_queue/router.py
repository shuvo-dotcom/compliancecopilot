from fastapi import APIRouter, Request, HTTPException, Depends
from review_queue.service import QueueService

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("/")
async def list_pending(request: Request, service: QueueService = Depends()):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await service.list_pending(user_id)


@router.post("/{job_id}/approve")
async def approve(job_id: str, request: Request, service: QueueService = Depends()):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await service.approve(job_id, user_id)


@router.post("/{job_id}/reject")
async def reject(job_id: str, request: Request, service: QueueService = Depends()):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await service.reject(job_id, user_id)


@router.patch("/{job_id}/findings/{finding_id}")
async def edit_finding(
    job_id: str,
    finding_id: str,
    request: Request,
    service: QueueService = Depends(),
):
    body = await request.json()
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await service.edit_finding(job_id, finding_id, body, user_id)
