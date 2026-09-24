from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_membership
from app.models.project import Project
from app.models.task import Task
from app.models.tenant_membership import TenantMembership
from app.schemas.task import TaskCreate, TaskStatusUpdate

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks"])


async def owned_project(project_id: int, membership: TenantMembership, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == membership.tenant_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("/")
async def list_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    result = await db.execute(select(Task).where(Task.project_id == project_id).order_by(Task.id))
    return result.scalars().all()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: int,
    task: TaskCreate,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    new_task = Task(title=task.title, project_id=project_id, status="todo")
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task


@router.patch("/{task_id}")
async def update_task(
    project_id: int,
    task_id: int,
    update: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    result = await db.execute(select(Task).where(Task.id == task_id, Task.project_id == project_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task.status = update.status
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    result = await db.execute(select(Task).where(Task.id == task_id, Task.project_id == project_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await db.delete(task)
    await db.commit()