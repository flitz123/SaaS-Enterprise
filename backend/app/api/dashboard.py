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
    task_counts = await db.execute(
        select(Task.status, func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(Project.tenant_id == membership.tenant_id)
        .group_by(Task.status)
    )
    counts_by_status = dict(task_counts.all())
    total_tasks = sum(counts_by_status.values())
    completed_tasks = counts_by_status.get("completed", 0)
    paused_tasks = counts_by_status.get("paused", 0)
    active_tasks = total_tasks - completed_tasks - paused_tasks

    return {
        "project_count": project_count or 0,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "active_tasks": active_tasks,
        "paused_tasks": paused_tasks,
        "pulse": round((completed_tasks / total_tasks) * 100) if total_tasks else 0,
    }