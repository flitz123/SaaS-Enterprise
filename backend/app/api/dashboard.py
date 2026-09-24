from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_membership
from app.models.project import Project
from app.models.task import Task
from app.models.tenant_membership import TenantMembership

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    project_count = await db.scalar(
        select(func.count(Project.id)).where(Project.tenant_id == membership.tenant_id)
    )
    tasks = await db.scalars(
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(Project.tenant_id == membership.tenant_id)
    )
    task_list = list(tasks)
    total_tasks = len(task_list)
    completed_tasks = sum(task.status == "completed" for task in task_list)
    paused_tasks = sum(task.status == "paused" for task in task_list)
    active_tasks = total_tasks - completed_tasks - paused_tasks

    return {
        "project_count": project_count or 0,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "active_tasks": active_tasks,
        "paused_tasks": paused_tasks,
        "pulse": round((completed_tasks / total_tasks) * 100) if total_tasks else 0,
    }