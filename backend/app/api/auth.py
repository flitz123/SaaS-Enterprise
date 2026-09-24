from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.deps import get_current_user
from app.core.security import hash_password, verify_password, create_token
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.schemas.auth import Credentials, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(credentials: Credentials, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == credentials.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    tenant = Tenant(name=f"{credentials.email}'s workspace")
    db.add(tenant)
    await db.flush()
    user = User(email=credentials.email, password=hash_password(credentials.password), tenant_id=tenant.id)
    db.add(user)
    await db.flush()
    db.add(TenantMembership(tenant_id=tenant.id, user_id=user.id, role="owner"))
    await db.commit()
    return {"message": "User created"}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: Credentials, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    membership_result = await db.execute(
        select(TenantMembership).where(TenantMembership.user_id == user.id).order_by(TenantMembership.id)
    )
    membership = membership_result.scalars().first()
    if membership is None:
        tenant = Tenant(name=f"{user.email}'s workspace")
        db.add(tenant)
        await db.flush()
        membership = TenantMembership(tenant_id=tenant.id, user_id=user.id, role="owner")
        db.add(membership)
        user.tenant_id = tenant.id
        await db.commit()
    token = create_token({"sub": user.email, "tenant_id": membership.tenant_id})
    return {"access_token": token, "token_type": "bearer", "tenant_id": membership.tenant_id}


@router.post("/switch-tenant/{tenant_id}", response_model=TokenResponse)
async def switch_tenant(tenant_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    membership_result = await db.execute(
        select(TenantMembership).where(TenantMembership.user_id == user.id, TenantMembership.tenant_id == tenant_id)
    )
    membership = membership_result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this workspace")
    return {"access_token": create_token({"sub": user.email, "tenant_id": tenant_id}), "tenant_id": tenant_id}