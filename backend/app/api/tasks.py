from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_membership
from app.models.project import Project
from app.models.task import Task, TaskAssignment
from app.models.tenant_membership import TenantMembership
from app.models.user import User
from app.schemas.task import TaskAssigneeCreate, TaskCreate, TaskProgressUpdate, TaskStatusUpdate

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["Tasks"])


async def owned_project(project_id: int, membership: TenantMembership, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id, Project.tenant_id == membership.tenant_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def task_response(task: Task, db: AsyncSession) -> dict:
    result = await db.execute(
        select(TaskAssignment, User.email)
        .join(User, User.id == TaskAssignment.user_id)
        .where(TaskAssignment.task_id == task.id)
        .order_by(User.email)
    )
    assignees = [
        {"user_id": assignment.user_id, "email": email, "progress": assignment.progress}
        for assignment, email in result.all()
    ]
    return {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "project_id": task.project_id,
        "assignees": assignees,
    }


async def owned_task(project_id: int, task_id: int, db: AsyncSession) -> Task:
    result = await db.execute(select(Task).where(Task.id == task_id, Task.project_id == project_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("/")
async def list_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    result = await db.execute(select(Task).where(Task.project_id == project_id).order_by(Task.id))
    return [await task_response(task, db) for task in result.scalars().all()]


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
    return await task_response(new_task, db)


@router.patch("/{task_id}")
async def update_task(
    project_id: int,
    task_id: int,
    update: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    task = await owned_task(project_id, task_id, db)
    task.status = update.status
    await db.commit()
    await db.refresh(task)
    return await task_response(task, db)


@router.post("/{task_id}/assignees", status_code=status.HTTP_201_CREATED)
async def assign_task_member(
    project_id: int,
    task_id: int,
    assignee: TaskAssigneeCreate,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    project = await owned_project(project_id, membership, db)
    await owned_task(project_id, task_id, db)
    member_result = await db.execute(
        select(TenantMembership).where(
            TenantMembership.tenant_id == project.tenant_id,
            TenantMembership.user_id == assignee.user_id,
        )
    )
    if member_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignee is not a workspace member")
    existing = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == assignee.user_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Member is already assigned")
    assignment = TaskAssignment(task_id=task_id, user_id=assignee.user_id, progress=0)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    email = await db.scalar(select(User.email).where(User.id == assignee.user_id))
    return {"user_id": assignment.user_id, "email": email, "progress": assignment.progress}


@router.patch("/{task_id}/assignees/{user_id}")
async def update_task_member_progress(
    project_id: int,
    task_id: int,
    user_id: int,
    update: TaskProgressUpdate,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    await owned_task(project_id, task_id, db)
    result = await db.execute(
        select(TaskAssignment, User.email)
        .join(User, User.id == TaskAssignment.user_id)
        .where(TaskAssignment.task_id == task_id, TaskAssignment.user_id == user_id)
    )
    assignment_row = result.one_or_none()
    if assignment_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task assignee not found")
    assignment, email = assignment_row
    assignment.progress = update.progress
    await db.commit()
    return {"user_id": user_id, "email": email, "progress": assignment.progress}


@router.delete("/{task_id}/assignees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task_member(
    project_id: int,
    task_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    await owned_task(project_id, task_id, db)
    result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == user_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task assignee not found")
    await db.delete(assignment)
    await db.commit()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    await owned_project(project_id, membership, db)
    task = await owned_task(project_id, task_id, db)
    assignments = await db.execute(select(TaskAssignment).where(TaskAssignment.task_id == task_id))
    for assignment in assignments.scalars():
        await db.delete(assignment)
    await db.delete(task)
    await db.commit()