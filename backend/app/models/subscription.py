from sqlalchemy import Column, Integer, String, ForeignKey
from app.models.base import Base

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    plan = Column(String)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))