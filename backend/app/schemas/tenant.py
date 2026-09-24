from typing import Literal

from pydantic import BaseModel, EmailStr, Field


Role = Literal["owner", "admin", "member"]


class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class MemberAdd(BaseModel):
    email: EmailStr
    role: Literal["admin", "member"] = "member"


class RoleUpdate(BaseModel):
    role: Literal["admin", "member"]