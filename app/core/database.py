"""
app/core/database.py
────────────────────
SQLAlchemy engine + session factory.
Provides get_db() dependency for FastAPI routes.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

from app.core.config import get_settings

settings = get_settings()

# SQLite needs connect_args; Postgres / MySQL do not
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.APP_ENV == "development",  # SQL logging in dev only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables on startup (dev/test).  Use Alembic for production."""
    from app.models import payment  # noqa: F401 – registers models with Base
    Base.metadata.create_all(bind=engine)
