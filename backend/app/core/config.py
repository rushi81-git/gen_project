import os
from typing import List
from pydantic_settings import BaseSettings

# ponytail: simple pydantic-settings config, no custom parser boilerplate
class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    API_PREFIX: str = "/api"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    # Database
    DATABASE_URL: str = "sqlite:///./monitoring.db"
    
    # Hugging Face
    HF_API_TOKEN: str = ""
    HF_API_BASE_URL: str = "https://router.huggingface.co/hf-inference/models"
    DEFAULT_LOCAL_MODEL: str = "distilbert/distilgpt2"
    MODEL_CACHE_DIR: str = "./.cache/huggingface"
    
    # Alert thresholds
    ALERT_ERROR_RATE_THRESHOLD: float = 10.0  # percentage
    ALERT_P95_LATENCY_THRESHOLD_MS: float = 2500.0  # ms
    ALERT_CONSECUTIVE_FAILURES_THRESHOLD: int = 3
    
    # Privacy & Retention
    LOG_PROMPT_BODY: bool = True
    MAX_PROMPT_PREVIEW_LENGTH: int = 250

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
