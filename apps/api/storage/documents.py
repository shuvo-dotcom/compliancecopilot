from minio import Minio
from core.config import settings
import uuid
import io

BUCKET_NAME = "compliancecopilot"

_client: Minio | None = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False,
        )
    return _client


async def ensure_bucket():
    client = get_minio_client()
    if not client.bucket_exists(BUCKET_NAME):
        client.make_bucket(BUCKET_NAME)


async def upload_document(file_bytes: bytes, filename: str, content_type: str) -> str:
    await ensure_bucket()
    client = get_minio_client()
    object_name = f"documents/{uuid.uuid4()}/{filename}"
    client.put_object(
        BUCKET_NAME,
        object_name,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    return object_name


async def download_document(object_name: str) -> bytes:
    client = get_minio_client()
    response = client.get_object(BUCKET_NAME, object_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


async def upload_report(report_bytes: bytes, job_id: str) -> str:
    await ensure_bucket()
    client = get_minio_client()
    object_name = f"reports/{job_id}/report.json"
    client.put_object(
        BUCKET_NAME,
        object_name,
        io.BytesIO(report_bytes),
        length=len(report_bytes),
        content_type="application/json",
    )
    return object_name
