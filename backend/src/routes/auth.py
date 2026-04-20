from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import timedelta

from src.db.database import get_db
from src.models.user import User as UserModel
from src.models.tenant import Tenant as TenantModel
from src.models.permissions import Role, UserRole
from src.schemas.user import User, UserCreate
from src.schemas.tenant import Tenant, TenantCreate
from src.utils.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["Authentication"])

ENTERPRISE_ADMIN_PERMISSIONS = {
    "can_manage_entities": True,
    "can_manage_workflows": True,
    "can_manage_users": True,
    "can_manage_roles": True,
    "can_create_records": True,
    "can_view_all_records": True,
    "can_edit_all_records": True,
    "can_delete_records": True,
    "is_enterprise_admin": True,
}


@router.post("/login")
def login(username: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    org = None
    permissions = {}
    role_name = user.role or "viewer"

    # Enterprise admin: global access, no org lookup needed
    if user.role == "enterprise_admin":
        permissions = ENTERPRISE_ADMIN_PERMISSIONS
        role_name = "enterprise_admin"
    elif user.organization_id:
        org = db.query(TenantModel).filter(TenantModel.id == user.organization_id).first()
        if org:
            db.execute(text(f"SET search_path TO {org.schema_name}, public"))
            user_role = db.query(UserRole).filter(UserRole.user_id == user.id).first()
            if user_role:
                role = db.query(Role).filter(Role.id == user_role.role_id).first()
                if role:
                    role_name = role.name
                    permissions = {
                        "can_manage_entities": role.can_manage_entities,
                        "can_manage_workflows": role.can_manage_workflows,
                        "can_manage_users": role.can_manage_users,
                        "can_manage_roles": role.can_manage_roles,
                        "can_create_records": role.can_create_records,
                        "can_view_all_records": role.can_view_all_records,
                        "can_edit_all_records": role.can_edit_all_records,
                        "can_delete_records": role.can_delete_records,
                        "is_enterprise_admin": False,
                    }
            db.execute(text("SET search_path TO public"))

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "org": org.schema_name if org else "public",
            "role": role_name,
            "permissions": permissions
        },
        expires_delta=access_token_expires
    )

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": role_name,
            "permissions": permissions,
            "organization_id": user.organization_id
        },
        "organization": org,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/users")
def list_all_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    orgs = {o.id: o for o in db.query(TenantModel).all()}
    result = []
    for user in users:
        org = orgs.get(user.organization_id)
        result.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role or "viewer",
            "is_active": user.is_active,
            "created_at": user.created_at,
            "organization_id": user.organization_id,
            "organization_name": org.name if org else None,
            "organization_schema": org.schema_name if org else None,
        })
    return result


@router.get("/organizations", response_model=List[Tenant])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(TenantModel).filter(TenantModel.is_active == True).all()


@router.post("/register-org", response_model=Tenant)
def register_organization(org: TenantCreate, db: Session = Depends(get_db)):
    db_org = db.query(TenantModel).filter(TenantModel.schema_name == org.schema_name).first()
    if db_org:
        raise HTTPException(status_code=400, detail="Organization already exists")
    new_org = TenantModel(**org.model_dump())
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org
