from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict

from src.db.database import get_db
from src.models.user import User as UserModel
from src.models.tenant import Tenant as TenantModel
from src.models.permissions import Role, UserRole
from src.utils.tenant_context import get_tenant_db, get_tenant_schema
from src.utils.auth import get_current_user, get_password_hash

router = APIRouter(tags=["Organization Admin"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RoleCreate(BaseModel):
    name: str
    can_manage_entities: bool = False
    can_manage_workflows: bool = False
    can_manage_users: bool = False
    can_manage_roles: bool = False
    can_create_records: bool = True
    can_view_all_records: bool = False
    can_edit_all_records: bool = False
    can_delete_records: bool = False
    # null = unrestricted (all steps write). Dict maps step label → "read"|"write". Absent key = hidden.
    allowed_steps: Optional[Dict[str, str]] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    can_manage_entities: Optional[bool] = None
    can_manage_workflows: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_manage_roles: Optional[bool] = None
    can_create_records: Optional[bool] = None
    can_view_all_records: Optional[bool] = None
    can_edit_all_records: Optional[bool] = None
    can_delete_records: Optional[bool] = None
    # null = unrestricted. Dict maps step label → "read"|"write". Absent key = hidden.
    allowed_steps: Optional[Dict[str, str]] = None


class OrgUserCreate(BaseModel):
    username: str
    full_name: str
    email: str
    password: Optional[str] = "changeme123"
    role_id: Optional[int] = None


class OrgUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role_id: Optional[int] = None
    full_name: Optional[str] = None


# ─── Permission Helper ────────────────────────────────────────────────────────

def _require(user: UserModel, db: Session, permission: str):
    """Enterprise admins always pass. Org users must have the permission on their role."""
    if user.role == "enterprise_admin":
        return
    ur = db.query(UserRole).filter(UserRole.user_id == user.id).first()
    if not ur:
        raise HTTPException(status_code=403, detail="No role assigned in this organization")
    role = db.query(Role).filter(Role.id == ur.role_id).first()
    if not role or not getattr(role, permission, False):
        raise HTTPException(status_code=403, detail="Permission denied")


# ─── Roles CRUD ───────────────────────────────────────────────────────────────

@router.get("/roles")
def list_roles(
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
):
    return db.query(Role).all()


@router.post("/roles", status_code=201)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
):
    _require(current_user, db, "can_manage_roles")
    if db.query(Role).filter(Role.name == role_in.name).first():
        raise HTTPException(status_code=400, detail="Role name already exists")
    new_role = Role(**role_in.model_dump())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


@router.put("/roles/{role_id}")
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
):
    _require(current_user, db, "can_manage_roles")
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    data = role_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(role, key, value)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
):
    _require(current_user, db, "can_manage_roles")
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
    return {"ok": True}


# ─── Org User Management ──────────────────────────────────────────────────────

@router.get("/org/users")
def list_org_users(
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
    tenant_schema: str = Depends(get_tenant_schema),
):
    _require(current_user, db, "can_manage_users")

    tenant = db.query(TenantModel).filter(TenantModel.schema_name == tenant_schema).first()
    org_id = tenant.id if tenant else current_user.organization_id

    users = db.query(UserModel).filter(UserModel.organization_id == org_id).all()

    result = []
    for u in users:
        ur = db.query(UserRole).filter(UserRole.user_id == u.id).first()
        role = db.query(Role).filter(Role.id == ur.role_id).first() if ur else None
        result.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "is_active": u.is_active,
            "role_id": ur.role_id if ur else None,
            "role_name": role.name if role else None,
            "created_at": u.created_at,
        })
    return result


@router.put("/org/users/{user_id}")
def update_org_user(
    user_id: int,
    user_in: OrgUserUpdate,
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
):
    _require(current_user, db, "can_manage_users")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.full_name is not None:
        user.full_name = user_in.full_name

    if user_in.role_id is not None:
        ur = db.query(UserRole).filter(UserRole.user_id == user_id).first()
        if ur:
            ur.role_id = user_in.role_id
        else:
            db.add(UserRole(user_id=user_id, role_id=user_in.role_id))

    db.commit()
    return {"ok": True}


@router.post("/org/users", status_code=201)
def create_org_user(
    user_in: OrgUserCreate,
    db: Session = Depends(get_tenant_db),
    current_user: UserModel = Depends(get_current_user),
    tenant_schema: str = Depends(get_tenant_schema),
):
    _require(current_user, db, "can_manage_users")

    tenant = db.query(TenantModel).filter(TenantModel.schema_name == tenant_schema).first()
    org_id = tenant.id if tenant else current_user.organization_id

    if db.query(UserModel).filter(
        (UserModel.username == user_in.username) | (UserModel.email == user_in.email)
    ).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    new_user = UserModel(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password or "changeme123"),
        role="org_user",
        organization_id=org_id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    if user_in.role_id:
        db.add(UserRole(user_id=new_user.id, role_id=user_in.role_id))

    db.commit()
    db.refresh(new_user)
    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "is_active": new_user.is_active,
    }
