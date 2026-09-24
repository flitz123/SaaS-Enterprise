from sqlalchemy import Column, ForeignKey, Integer, String

from app.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="todo")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)