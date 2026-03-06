from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql + asyncpg://saas:saas@db:5432/saas_db"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY:str = "SUPER_SECRET_KEY"
    ALGORITHM: str = "HS256"

settings = Settings()