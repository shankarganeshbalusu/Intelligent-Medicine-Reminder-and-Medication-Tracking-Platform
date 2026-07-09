import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PillSync API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pillsync-super-secret-key-change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pillsync.db")

    class Config:
        case_sensitive = True

settings = Settings()
