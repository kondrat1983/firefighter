from typing import Any, Dict, Optional, List
from pydantic import BaseSettings, PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    SECRET_KEY: str
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "firefighter"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "firefighter"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    REDDIT_USER_AGENT: str = "Firefighter/1.0"
    STEAM_API_KEY: Optional[str] = None
    TWITTER_BEARER_TOKEN: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Logging
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None
    
    # Processing Configuration
    EMBEDDING_MODEL: str = "text-embedding-ada-002"
    CLUSTERING_MIN_SAMPLES: int = 3
    CLUSTERING_EPS: float = 0.3
    ALERT_THRESHOLD_MENTIONS: int = 10
    ALERT_THRESHOLD_MINUTES: int = 10
    ALERT_THRESHOLD_SOURCES: int = 2
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()