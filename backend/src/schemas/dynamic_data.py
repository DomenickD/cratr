from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class FieldDefinitionBase(BaseModel):
    name: str
    display_name: str
    field_type: str
    is_required: bool = False
    default_value: Optional[Any] = None
    configuration: Optional[Dict[str, Any]] = None

class FieldDefinitionCreate(FieldDefinitionBase):
    pass

class FieldDefinitionUpdate(BaseModel):
    display_name: Optional[str] = None
    field_type: Optional[str] = None
    is_required: Optional[bool] = None
    default_value: Optional[Any] = None
    configuration: Optional[Dict[str, Any]] = None

class FieldDefinition(FieldDefinitionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_definition_id: int

class EntityDefinitionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None

class EntityDefinitionCreate(EntityDefinitionBase):
    fields: List[FieldDefinitionCreate] = []

class EntityDefinitionUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    workflow_config: Optional[Dict[str, Any]] = None

class EntityDefinition(EntityDefinitionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    workflow_config: Optional[Dict[str, Any]] = None
    fields: List[FieldDefinition]

class EntityRecordBase(BaseModel):
    entity_definition_id: int
    data: Dict[str, Any]

class EntityRecordCreate(EntityRecordBase):
    pass

class EntityRecordUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None

class EntityRecord(EntityRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
