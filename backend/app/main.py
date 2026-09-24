from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api import auth, dashboard, projects, tasks, websocket
from app.config import settings
from app.models.base import Base
from app.core.database import engine
import app.models  # noqa: F401

app = FastAPI(title="Enterprise SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(websocket.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        project_columns = await conn.run_sync(
            lambda connection: {column["name"] for column in inspect(connection).get_columns("projects")}
        )
        if "owner_id" not in project_columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN owner_id INTEGER REFERENCES users(id)"))

@app.get("/")
async def root():
    return {"status": "running"}