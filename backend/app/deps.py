from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.tenant_membership import TenantMembership

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
	credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
	db: AsyncSession = Depends(get_db),
) -> User:
	if credentials is None:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

	try:
		payload = decode_token(credentials.credentials)
		email = payload.get("sub")
	except Exception as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

	result = await db.execute(select(User).where(User.email == email))
	user = result.scalar_one_or_none()
	if user is None:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


async def get_current_membership(
	credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
	db: AsyncSession = Depends(get_db),
) -> TenantMembership:
	user = await get_current_user(credentials, db)
	try:
		payload = decode_token(credentials.credentials) if credentials else {}
		tenant_id = payload.get("tenant_id") or user.tenant_id
	except Exception as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

	result = await db.execute(
		select(TenantMembership).where(
			TenantMembership.user_id == user.id,
			TenantMembership.tenant_id == tenant_id,
		)
	)
	membership = result.scalar_one_or_none()
	if membership is None:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this workspace")
	return membership
