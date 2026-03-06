import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_URL(settings.REDIS_URL, decode_responses=True)