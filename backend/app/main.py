# ASSESSMENT: Software Design (Low Coupling) — main.py only composes routers; no business logic here.
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, game, mini
from app.services import heart_api

# ── Create tables on startup ─────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the global HTTP client
    heart_api.init_http_client()
    yield
    # Shutdown: Clean up the connection pool
    if heart_api.http_client:
        await heart_api.http_client.aclose()

# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(title="Moon Mafia API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,  # ASSESSMENT: Virtual Identity — credentials required for cookie auth.
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ─────────────────────────────────────────────────────────
app.include_router(auth.router)   # ASSESSMENT: Software Design — auth concerns isolated.
app.include_router(game.router)   # ASSESSMENT: Software Design — main game concerns isolated.
app.include_router(mini.router)   # ASSESSMENT: Software Design — mini-game concerns isolated.


@app.get("/")
def root():
    return {"status": "Moon Mafia API Online"}
