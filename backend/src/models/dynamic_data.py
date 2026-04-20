from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.database import Base


class EntityDefinition(Base):
    """Defines a dynamic 'table' created by an admin."""

    __tablename__ = "entity_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # e.g., "RFI"
    display_name = Column(String, nullable=False)
    description = Column(String)
    workflow_config = Column(JSON)  # Stores { nodes: [], edges: [] }
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fields = relationship(
        "FieldDefinition",
        back_populates="entity_definition",
        cascade="all, delete-orphan",
    )
    records = relationship("EntityRecord", back_populates="entity_definition")


class FieldDefinition(Base):
    """Defines a dynamic 'column' within an EntityDefinition."""

    __tablename__ = "field_definitions"

    id = Column(Integer, primary_key=True, index=True)
    entity_definition_id = Column(
        Integer, ForeignKey("entity_definitions.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String, nullable=False)  # e.g., "priority"
    display_name = Column(String, nullable=False)
    field_type = Column(
        String, nullable=False
    )  # e.g., "text", "number", "date", "jsonb", "boolean"
    is_required = Column(Boolean, default=False)
    default_value = Column(JSON)  # Stored as JSON for flexibility
    configuration = Column(JSON)  # For select options, ranges, etc.

    entity_definition = relationship("EntityDefinition", back_populates="fields")


class EntityRecord(Base):
    """Stores the actual data for a dynamic entity using JSONB."""

    __tablename__ = "entity_records"

    id = Column(Integer, primary_key=True, index=True)
    entity_definition_id = Column(
        Integer, ForeignKey("entity_definitions.id", ondelete="CASCADE"), nullable=False
    )
    data = Column(JSON, nullable=False)  # PostgreSQL JSONB column
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    entity_definition = relationship("EntityDefinition", back_populates="records")
