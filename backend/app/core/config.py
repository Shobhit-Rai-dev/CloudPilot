import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloudOps"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "cloudops-insecure-development-secret-key-2026-hackathon")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo ease
    
    # Dual database support: postgresql if configured, sqlite fallback for zero-dependency local dev
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cloudops.db")
    
    # Provider Mode: "mock" or "aws"
    CLOUD_PROVIDER: str = os.getenv("CLOUD_PROVIDER", "mock").lower()
    
    # AWS Settings (used when CLOUD_PROVIDER is aws or for AWS account verification)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)

    DEMO_MODE: bool = True

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
