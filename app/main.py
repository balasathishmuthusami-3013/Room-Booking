"""
app/main.py
───────────
FastAPI application factory.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging import logger
from app.routers import payments

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup / shutdown tasks."""
    logger.info("Starting Task Manager API | env=%s", settings.APP_ENV)
    init_db()   # creates tables – replace with Alembic in production
    yield
    logger.info("Shutting down Task Manager API")


app = FastAPI(
    title="Task Manager – Payment API",
    description=(
        "Production-ready Razorpay & Strike payment integration "
        "for the Task Manager application."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(payments.router)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "env": settings.APP_ENV}
