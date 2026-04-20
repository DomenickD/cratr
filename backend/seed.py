import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.getcwd(), "src"))

from src.db.database import DATABASE_URL, Base
from src.models.tenant import Tenant
from src.models.user import User
from src.models.dynamic_data import EntityDefinition, FieldDefinition
from src.models.permissions import Role, UserRole
from src.utils.auth import get_password_hash

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def seed_enterprise_admin(db):
    print("--- Seeding Enterprise Admin ---")
    admin = db.query(User).filter(User.username == "enterprise_admin").first()
    if not admin:
        admin = User(
            username="enterprise_admin",
            full_name="Enterprise Administrator",
            email="enterprise_admin@cratr.io",
            hashed_password=get_password_hash("password"),
            role="enterprise_admin",
            organization_id=None
        )
        db.add(admin)
        db.commit()
        print("  Created enterprise_admin user")
    else:
        print("  enterprise_admin already exists")


def seed_organization(db, name, schema):
    print(f"--- Seeding Organization: {name} ({schema}) ---")

    # Create tenant record in public schema
    org = db.query(Tenant).filter(Tenant.schema_name == schema).first()
    if not org:
        org = Tenant(name=name, schema_name=schema)
        db.add(org)
        db.commit()
        db.refresh(org)

    # Create the Postgres schema
    db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
    db.commit()

    # Create tables in org schema
    db.execute(text(f"SET search_path TO {schema}, public"))

    # 1. Roles
    org_admin_role = db.query(Role).filter(Role.name == "Org Admin").first()
    if not org_admin_role:
        org_admin_role = Role(
            name="Org Admin",
            can_manage_entities=True,
            can_manage_workflows=True,
            can_manage_users=True,
            can_manage_roles=True,
            can_create_records=True,
            can_view_all_records=True,
            can_edit_all_records=True,
            can_delete_records=True
        )
        db.add(org_admin_role)

    requestor_role = db.query(Role).filter(Role.name == "Requestor").first()
    if not requestor_role:
        requestor_role = Role(
            name="Requestor",
            can_create_records=True,
            can_view_all_records=False
        )
        db.add(requestor_role)
    db.commit()

    # 2. Org Admin user
    admin_username = f"{schema}_admin"
    db.execute(text("SET search_path TO public"))
    db_user = db.query(User).filter(User.username == admin_username).first()
    if not db_user:
        new_user = User(
            username=admin_username,
            full_name=f"{name} Admin",
            email=f"{admin_username}@{schema}.cratr.io",
            hashed_password=get_password_hash("password"),
            role="org_admin",
            organization_id=org.id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        db.execute(text(f"SET search_path TO {schema}, public"))
        db.add(UserRole(user_id=new_user.id, role_id=org_admin_role.id))
        db.commit()
        db.execute(text("SET search_path TO public"))
        print(f"  Created {admin_username} user")
    else:
        print(f"  {admin_username} already exists")

    # 3. Seed a default RFI Tracker in this org's schema
    db.execute(text(f"SET search_path TO {schema}, public"))
    rfi = db.query(EntityDefinition).filter(EntityDefinition.name == "rfi_tracker").first()
    if not rfi:
        rfi = EntityDefinition(
            name="rfi_tracker",
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
        print(f"  Created RFI Tracker for {name}")
    else:
        print(f"  RFI Tracker already exists for {name}")

    db.execute(text("SET search_path TO public"))


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_enterprise_admin(db)
        seed_organization(db, "JICSAW", "jicsaw")
        seed_organization(db, "PUZZLE", "puzzle")
        print("\n✅ Seeding complete!")
        print("   enterprise_admin  → Enterprise Administrator")
        print("   jicsaw_admin      → JICSAW Org Admin")
        print("   puzzle_admin      → PUZZLE Org Admin")
        print("   (all passwords: 'password')")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
