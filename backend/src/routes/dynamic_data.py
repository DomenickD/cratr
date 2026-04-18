from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from src.db.database import get_db
from src.models.dynamic_data import EntityDefinition as EntityModel, FieldDefinition as FieldModel, EntityRecord as RecordModel
from src.schemas.dynamic_data import (
    EntityDefinition, EntityDefinitionCreate, EntityDefinitionUpdate,
    FieldDefinitionCreate, FieldDefinitionUpdate,
    EntityRecord, EntityRecordCreate, EntityRecordUpdate
)
from src.utils.tenant_context import get_tenant_db
from src.utils.auth import get_current_user

router = APIRouter(prefix="/entities", tags=["Dynamic Entities"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=EntityDefinition)
def create_entity_definition(
    entity: EntityDefinitionCreate, 
    db: Session = Depends(get_tenant_db)
):
    db_entity = EntityModel(
        name=entity.name,
        display_name=entity.display_name,
        description=entity.description
    )
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)

    for field in entity.fields:
        db_field = FieldModel(
            entity_definition_id=db_entity.id,
            **field.model_dump()
        )
        db.add(db_field)
    
    db.commit()
    db.refresh(db_entity)
    return db_entity

@router.get("/", response_model=List[EntityDefinition])
def list_entity_definitions(db: Session = Depends(get_tenant_db)):
    return db.query(EntityModel).all()

@router.get("/{entity_id}", response_model=EntityDefinition)
def get_entity_definition(entity_id: int, db: Session = Depends(get_tenant_db)):
    entity = db.query(EntityModel).filter(EntityModel.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity

@router.put("/{entity_id}", response_model=EntityDefinition)
def update_entity_definition(
    entity_id: int, 
    entity_update: EntityDefinitionUpdate, 
    db: Session = Depends(get_tenant_db)
):
    db_entity = db.query(EntityModel).filter(EntityModel.id == entity_id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    update_data = entity_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entity, key, value)
    
    db.commit()
    db.refresh(db_entity)
    return db_entity

# --- Field Endpoints ---

@router.post("/{entity_id}/fields", response_model=EntityDefinition)
def add_field_to_entity(
    entity_id: int,
    field: FieldDefinitionCreate,
    db: Session = Depends(get_tenant_db)
):
    db_entity = db.query(EntityModel).filter(EntityModel.id == entity_id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    db_field = FieldModel(entity_definition_id=entity_id, **field.model_dump())
    db.add(db_field)
    db.commit()
    db.refresh(db_entity)
    return db_entity

@router.put("/{entity_id}/fields/{field_id}", response_model=EntityDefinition)
def update_field_definition(
    entity_id: int,
    field_id: int,
    field_update: FieldDefinitionUpdate,
    db: Session = Depends(get_tenant_db)
):
    db_field = db.query(FieldModel).filter(FieldModel.id == field_id, FieldModel.entity_definition_id == entity_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    update_data = field_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_field, key, value)
    
    db.commit()
    return get_entity_definition(entity_id, db)

@router.delete("/{entity_id}/fields/{field_id}")
def delete_field_definition(entity_id: int, field_id: int, db: Session = Depends(get_tenant_db)):
    db_field = db.query(FieldModel).filter(FieldModel.id == field_id, FieldModel.entity_definition_id == entity_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(db_field)
    db.commit()
    return {"message": "Field deleted"}

@router.delete("/{entity_id}")
def delete_entity_definition(entity_id: int, db: Session = Depends(get_tenant_db)):
    db_entity = db.query(EntityModel).filter(EntityModel.id == entity_id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    db.delete(db_entity)
    db.commit()
    return {"message": "Entity deleted"}

# --- Records ---

@router.post("/{entity_id}/records", response_model=EntityRecord)
def create_entity_record(
    entity_id: int,
    record: EntityRecordCreate,
    db: Session = Depends(get_tenant_db)
):
    entity_def = db.query(EntityModel).filter(EntityModel.id == entity_id).first()
    if not entity_def:
        raise HTTPException(status_code=404, detail="Entity definition not found")

    if record.entity_definition_id != entity_id:
         raise HTTPException(status_code=400, detail="Mismatched entity_id")

    db_record = RecordModel(
        entity_definition_id=entity_id,
        data=record.data
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/{entity_id}/records", response_model=List[EntityRecord])
def list_entity_records(entity_id: int, db: Session = Depends(get_tenant_db)):
    return db.query(RecordModel).filter(RecordModel.entity_definition_id == entity_id).all()

@router.get("/{entity_id}/records/{record_id}", response_model=EntityRecord)
def get_entity_record(entity_id: int, record_id: int, db: Session = Depends(get_tenant_db)):
    record = db.query(RecordModel).filter(RecordModel.id == record_id, RecordModel.entity_definition_id == entity_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@router.put("/{entity_id}/records/{record_id}", response_model=EntityRecord)
def update_entity_record(
    entity_id: int,
    record_id: int,
    record_update: EntityRecordUpdate,
    db: Session = Depends(get_tenant_db)
):
    db_record = db.query(RecordModel).filter(RecordModel.id == record_id, RecordModel.entity_definition_id == entity_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if record_update.data is not None:
        new_data = db_record.data.copy()
        new_data.update(record_update.data)
        db_record.data = new_data
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{entity_id}/records/{record_id}")
def delete_entity_record(entity_id: int, record_id: int, db: Session = Depends(get_tenant_db)):
    db_record = db.query(RecordModel).filter(RecordModel.id == record_id, RecordModel.entity_definition_id == entity_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted"}
