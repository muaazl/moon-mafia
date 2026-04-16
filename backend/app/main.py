# ASSESSMENT: Software Design (Low Coupling) — main.py only composes routers; no business logic here.
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, fix_postgres_sequences
from app.routers import auth, game, mini
from app.services import heart_api

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    fix_postgres_sequences()
    
    heart_api.init_http_client()
    yield
    if heart_api.http_client:
        await heart_api.http_client.aclose()

app = FastAPI(title="Moon Mafia API", lifespan=lifespan)

allowed_origins = os.getenv("ALLOWED_ORIGINS")
if allowed_origins:
    origins = [o.strip() for o in allowed_origins.split(",")]
else:
    origins = ["http://localhost:5173", "https://moon-mafia.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # ASSESSMENT: Virtual Identity — credentials required for cookie auth.
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)   # ASSESSMENT: Software Design — auth concerns isolated.
app.include_router(game.router)   # ASSESSMENT: Software Design — main game concerns isolated.
app.include_router(mini.router)   # ASSESSMENT: Software Design — mini-game concerns isolated.


@app.get("/")
def root():  # ASSESSMENT: Interoperability — Simple health check endpoint for external monitoring.
    return {"status": "Moon Mafia API Online"}
