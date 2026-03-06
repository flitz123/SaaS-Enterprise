from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def login(email: str, password: str, db:AsyncSession = Depends(get_db)):
    user = User(email=email, password=hash_password(password))
    db.add(user)
    await db.commit()
    return {"message": "User created"}

@router.post("/login")
async def register(email: str, password: str, db:AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email==email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password):
        raise
    HTTPException(status_code=400, detail="Invalid Credentials")
    token = create_token({"sub": user.email})
    return {"access_token": token}