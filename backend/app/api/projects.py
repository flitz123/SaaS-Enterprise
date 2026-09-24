from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from app.core.database import get_db
from app.deps import get_current_membership, get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.tenant_membership import TenantMembership
from app.models.user import User
from app.schemas.project import ProjectCreate

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    membership: TenantMembership = Depends(get_current_membership),
):
    result = await db.execute(select(Project).where(Project.tenant_id == membership.tenant_id))
    return result.scalars().all()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: TenantMembership = Depends(get_current_membership),
):
    new_project = Project(name=project.name, owner_id=user.id, tenant_id=membership.tenant_id)
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    membership: TenantMembership = Depends(get_current_membership),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.tenant_id == membership.tenant_id)
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.owner_id != user.id and membership.role not in {"owner", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project owners or admins can delete projects")

    await db.execute(delete(Task).where(Task.project_id == project_id))
    await db.delete(project)
    await db.commit()