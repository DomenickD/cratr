from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.db.database import Base

class Role(Base):
    """
    Organization-specific roles containing the Permission Grid.
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    # Permission Grid (Inspired by chaseg_tracker)
    can_manage_entities = Column(Boolean, default=False) # Can use Form Builder
    can_manage_workflows = Column(Boolean, default=False) # Can use Workflow Canvas
    can_manage_users = Column(Boolean, default=False) # Can adjust roles of others
    can_manage_roles = Column(Boolean, default=False) # Can edit the permission grid
    
    can_create_records = Column(Boolean, default=True)
    can_view_all_records = Column(Boolean, default=False) # If False, can only see own
    can_edit_all_records = Column(Boolean, default=False)
    can_delete_records = Column(Boolean, default=False)

class UserRole(Base):
    """
    Association between Global Users and Tenant Roles.
    """
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False) # Links to public.users.id
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    role = relationship("Role")
