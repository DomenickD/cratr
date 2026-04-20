from fastapi import FastAPI

from src.db.database import engine, Base
from src.routes.dynamic_data import router as dynamic_router
from src.routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cratr Enterprise API",
    servers=[{"url": "/api", "description": "Production (via nginx)"}],
)

app.include_router(auth_router)
app.include_router(dynamic_router)

@app.get("/")
async def root():
    return {"message": "Cratr API is running"}
