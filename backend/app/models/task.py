from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint

from app.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="todo")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)


class TaskAssignment(Base):
    __tablename__ = "task_assignments"
    __table_args__ = (UniqueConstraint("task_id", "user_id", name="uq_task_assignment"),)

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    progress = Column(Integer, nullable=False, default=0)