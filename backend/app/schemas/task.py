from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["todo", "completed", "paused"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)


class TaskStatusUpdate(BaseModel):
    status: TaskStatus