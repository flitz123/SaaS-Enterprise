from fastapi import FastAPI
from app.api import auth, projects, websocket
from app.models.base import Base
from app.core.database import engine

app = FastAPI(title="Enterprise SaaS")

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(websocket.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"status": "running"}