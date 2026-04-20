from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.db.database import get_db, engine, Base
from src.models.tenant import Tenant as TenantModel
from src.schemas.tenant import Tenant, TenantCreate
from src.utils.tenant_context import get_tenant_db
from src.routes.dynamic_data import router as dynamic_router
from src.routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cratr Enterprise API")

app.include_router(auth_router)
app.include_router(dynamic_router)

# Root / Health check
@app.get("/")
async def root():
    return {"message": "Cratr API is running"}

# Tenant management (Public Schema)
@app.get("/tenants", response_model=List[Tenant])
def read_tenants(db: Session = Depends(get_db)):
    tenants = db.query(TenantModel).all()
    return tenants

@app.post("/tenants", response_model=Tenant)
def create_tenant(tenant: TenantCreate, db: Session = Depends(get_db)):
    # Check if exists
    db_tenant = db.query(TenantModel).filter(TenantModel.schema_name == tenant.schema_name).first()
    if db_tenant:
        raise HTTPException(status_code=400, detail="Tenant schema already exists")
    
    new_tenant = TenantModel(**tenant.model_dump())
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    # In a real scenario, we would also trigger the DB schema creation here
    # For now, we'll just register it in the public registry.
    return new_tenant

# Sample Dynamic Route (Uses Tenant-specific DB)
@app.get("/me")
def get_current_context(tenant_db: Session = Depends(get_tenant_db)):
    # This session is already set to the tenant's schema
    return {"message": "Authenticated and routed to tenant schema"}
