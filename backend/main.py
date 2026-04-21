from fastapi import FastAPI

from src.db.database import engine, Base
from src.routes.dynamic_data import router as dynamic_router
from src.routes.auth import router as auth_router
from src.routes.roles import router as roles_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cratr Enterprise API",
    servers=[
        {"url": "/api", "description": "Production (via nginx)"},
        {"url": "/", "description": "Local (Direct 8081)"}
    ],
)

app.include_router(auth_router)
app.include_router(dynamic_router)
app.include_router(roles_router)

@app.get("/")
async def root():
    return {"message": "Cratr API is running"}
