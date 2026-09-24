from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_token
from app.models.user import User
from app.schemas.auth import Credentials, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(credentials: Credentials, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == credentials.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(email=credentials.email, password=hash_password(credentials.password))
    db.add(user)
    await db.commit()
    return {"message": "User created"}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: Credentials, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": create_token({"sub": user.email}), "token_type": "bearer"}