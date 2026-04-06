from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, users, disciplinas, sessoes, checkin, relatorios


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="NES - Sistema de Frequência",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(disciplinas.router, prefix="/api/disciplinas", tags=["disciplinas"])
app.include_router(sessoes.router, prefix="/api/sessoes", tags=["sessoes"])
app.include_router(checkin.router, prefix="/api/checkin", tags=["checkin"])
app.include_router(relatorios.router, prefix="/api/relatorios", tags=["relatorios"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
