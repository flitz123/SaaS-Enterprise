from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./saas.db"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()