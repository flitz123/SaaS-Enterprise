from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_membership, get_current_user
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.user import User
from app.schemas.tenant import MemberAdd, RoleUpdate, TenantCreate

router = APIRouter(prefix="/tenants", tags=["Tenants"])


def can_manage(role: str) -> bool:
    return role in {"owner", "admin"}


@router.get("/")
async def list_tenants(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tenant, TenantMembership.role)
        .join(TenantMembership, TenantMembership.tenant_id == Tenant.id)
        .where(TenantMembership.user_id == user.id)
        .order_by(Tenant.id)
    )
    return [{"id": tenant.id, "name": tenant.name, "role": role} for tenant, role in result.all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant = Tenant(name=tenant_data.name)
    db.add(tenant)
    await db.flush()
    db.add(TenantMembership(tenant_id=tenant.id, user_id=user.id, role="owner"))
    await db.commit()
    return {"id": tenant.id, "name": tenant.name, "role": "owner"}


@router.get("/{tenant_id}/members")
async def list_members(
    tenant_id: int,
    membership: TenantMembership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    if membership.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this workspace")
    result = await db.execute(
        select(User.id, User.email, TenantMembership.role)
        .join(TenantMembership, TenantMembership.user_id == User.id)
        .where(TenantMembership.tenant_id == tenant_id)
        .order_by(User.id)
    )
    return [{"id": user_id, "email": email, "role": role} for user_id, email, role in result.all()]


@router.post("/{tenant_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    tenant_id: int,
    member_data: MemberAdd,
    membership: TenantMembership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    if membership.tenant_id != tenant_id or not can_manage(membership.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace admins can add members")
    user_result = await db.execute(select(User).where(User.email == member_data.email))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User must register before being added")
    existing = await db.execute(
        select(TenantMembership).where(TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a workspace member")
    new_membership = TenantMembership(tenant_id=tenant_id, user_id=user.id, role=member_data.role)
    db.add(new_membership)
    await db.commit()
    return {"id": user.id, "email": user.email, "role": new_membership.role}


@router.patch("/{tenant_id}/members/{user_id}")
async def update_member_role(
    tenant_id: int,
    user_id: int,
    role_data: RoleUpdate,
    membership: TenantMembership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    if membership.tenant_id != tenant_id or membership.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the workspace owner can change roles")
    result = await db.execute(
        select(TenantMembership).where(TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user_id)
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    target.role = role_data.role
    await db.commit()
    return {"id": user_id, "role": target.role}


@router.delete("/{tenant_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    tenant_id: int,
    user_id: int,
    membership: TenantMembership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    if membership.tenant_id != tenant_id or not can_manage(membership.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only workspace admins can remove members")
    result = await db.execute(
        select(TenantMembership).where(TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user_id)
    )
    target = result.scalar_one_or_none()
    if target is None or target.role == "owner":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member cannot be removed")
    await db.delete(target)
    await db.commit()