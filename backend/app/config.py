from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./saas.db"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "ZxHS30fxkwB9aheS9X9YOuFG9I4RxiwtEp2hX7F9x4M"
    ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = "http://localhost:5173,https://saa-s-enterprise.vercel.app,https://saas-enterprise-ui.onrender.com"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()