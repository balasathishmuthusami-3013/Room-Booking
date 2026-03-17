"""
app/core/config.py
──────────────────
Central settings loaded from environment variables via pydantic-settings.
All API keys and secrets come exclusively from the environment – nothing is
hard-coded here.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./task_manager.db"

    # ── Razorpay ─────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str
    RAZORPAY_MODE: str = "test"          # "test" | "live"

    # ── Strike ───────────────────────────────────────────────────────────
    STRIKE_API_KEY: str
    STRIKE_WEBHOOK_SECRET: str
    STRIKE_ENV: str = "sandbox"          # "sandbox" | "production"

    # ── CORS ─────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def strike_base_url(self) -> str:
        if self.STRIKE_ENV == "production":
            return "https://api.strike.me/v1"
        return "https://api.strike.me/v1"   # Strike uses same URL; sandbox via test keys

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Use FastAPI's Depends(get_settings) for dependency injection.
    """
    return Settings()  # type: ignore[call-arg]
