from sqlalchemy import Column, Integer, String, ForeignKey
from app.models.base import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))