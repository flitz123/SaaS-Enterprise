from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./saas.db"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = "http://localhost:5173,https://saa-s-enterprise.vercel.app,https://saas-enterprise-ui.onrender.com"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()