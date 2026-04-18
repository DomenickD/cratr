from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TenantBase(BaseModel):
    name: str
    schema_name: str

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
