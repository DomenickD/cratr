import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from src.db.database import DATABASE_URL, Base
from src.models.tenant import Tenant
from src.models.user import User
from src.models.dynamic_data import EntityDefinition, FieldDefinition
from src.models.permissions import Role, UserRole
from src.utils.auth import get_password_hash

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed_organization(db, name, schema):
    print(f"--- Seeding Organization: {name} ({schema}) ---")
    org = db.query(Tenant).filter(Tenant.schema_name == schema).first()
    if not org:
        org = Tenant(name=name, schema_name=schema)
        db.add(org)
        db.commit()
        db.refresh(org)
    
    db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
    db.commit()

    # Switch to Org Schema
    db.execute(text(f"SET search_path TO {schema}, public"))
    
    # 1. Create Roles
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        admin_role = Role(
            name="Admin",
            can_manage_entities=True,
            can_manage_workflows=True,
            can_manage_users=True,
            can_manage_roles=True,
            can_create_records=True,
            can_view_all_records=True,
            can_edit_all_records=True,
            can_delete_records=True
        )
        db.add(admin_role)
    
    requestor_role = db.query(Role).filter(Role.name == "Requestor").first()
    if not requestor_role:
        requestor_role = Role(
            name="Requestor",
            can_create_records=True,
            can_view_all_records=False
        )
        db.add(requestor_role)
    db.commit()

    # 2. Create Users (Standard names for JICSAW)
    users_to_create = []
    if schema == "jicsaw":
        users_to_create = [
            {"username": "admin", "full_name": "JICSAW Admin", "role_id": admin_role.id},
            {"username": "requestor", "full_name": "JICSAW Requestor", "role_id": requestor_role.id},
        ]
    else:
        users_to_create = [
            {"username": f"{schema}_admin", "full_name": f"{name} Admin", "role_id": admin_role.id},
        ]

    db.execute(text("SET search_path TO public"))
    for u in users_to_create:
        db_user = db.query(User).filter(User.username == u["username"]).first()
        if not db_user:
            new_user = User(
                username=u["username"],
                full_name=u["full_name"],
                email=f"{u['username']}@{schema}.gov",
                hashed_password=get_password_hash("password"),
                organization_id=org.id
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            db.execute(text(f"SET search_path TO {schema}, public"))
            db.add(UserRole(user_id=new_user.id, role_id=u["role_id"]))
            db.commit()
            db.execute(text("SET search_path TO public"))

    # 3. Create RFI Tracker
    db.execute(text(f"SET search_path TO {schema}, public"))
    tracker_name = "rfi_tracker"
    rfi = db.query(EntityDefinition).filter(EntityDefinition.name == tracker_name).first()
    if not rfi:
        rfi = EntityDefinition(
            name=tracker_name,
            display_name="RFI Tracker",
            description=f"Standard RFI lifecycle for {name}",
            workflow_config={
                "nodes": [
                    {"id": "node-New", "type": "status", "position": {"x": 0, "y": 0}, "data": {"label": "New"}},
                    {"id": "node-In Progress", "type": "status", "position": {"x": 250, "y": 0}, "data": {"label": "In Progress"}},
                    {"id": "node-Completed", "type": "status", "position": {"x": 500, "y": 0}, "data": {"label": "Completed"}}
                ],
                "edges": [
                    {"id": "e1-2", "source": "node-New", "target": "node-In Progress", "animated": True},
                    {"id": "e2-3", "source": "node-In Progress", "target": "node-Completed", "animated": True}
                ]
            }
        )
        db.add(rfi)
        db.commit()
        db.refresh(rfi)

        db.add_all([
            FieldDefinition(entity_definition_id=rfi.id, name="title", display_name="Title", field_type="text", is_required=True),
            FieldDefinition(entity_definition_id=rfi.id, name="status", display_name="Status", field_type="select", configuration={"options": ["New", "In Progress", "Completed"]}),
            FieldDefinition(entity_definition_id=rfi.id, name="requestor", display_name="Requestor", field_type="text", default_value="@user"),
            FieldDefinition(entity_definition_id=rfi.id, name="date", display_name="Date", field_type="date", default_value="@today"),
        ])
        db.commit()

def seed():
    db = SessionLocal()
    try:
        seed_organization(db, "Seed Enterprise", "seed")
        seed_organization(db, "JICSAW Enterprise", "jicsaw")
        print("✅ Seeding successful!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
