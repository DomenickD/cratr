from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from src.db.database import get_db, set_tenant_schema
from src.models.tenant import Tenant

async def get_tenant_schema(request: Request):
    """
    Extracts tenant schema from header 'X-Tenant-ID' or subdomain.
    For now, we'll use a header for simplicity.
    """
    tenant_id = request.headers.get("X-Tenant-ID")
    if not tenant_id:
        # Default to public or raise error
        return "public"
    return tenant_id

def get_tenant_db(
    tenant_schema: str = Depends(get_tenant_schema),
    db: Session = Depends(get_db)
):
    """
    Dependency that returns a DB session configured for the current tenant's schema.
    """
    if tenant_schema != "public":
        # Check if tenant exists in registry
        tenant = db.query(Tenant).filter(Tenant.schema_name == tenant_schema, Tenant.is_active == True).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found or inactive")
        
        set_tenant_schema(db, tenant_schema)
    
    try:
        yield db
    finally:
        db.close()
