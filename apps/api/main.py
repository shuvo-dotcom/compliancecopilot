from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.database import init_db
from core.redis import close_redis
from auth.router import router as auth_router
from jobs.router import router as jobs_router
from review_queue.router import router as queue_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_redis()


app = FastAPI(
    title="ComplianceCopilot API",
    description="Self-hosted multi-agent compliance reviewer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="cc_session",
    same_site="lax",
    https_only=False,
    max_age=86400 * 7,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(queue_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
