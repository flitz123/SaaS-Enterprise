from sqlalchemy import Column, Integer, String, ForeignKey
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))