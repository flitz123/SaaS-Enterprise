from sqlalchemy import Column, Integer, String
from app.models.base import Base

class Tenant(Base):
    __tablename__ = "tenant"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)