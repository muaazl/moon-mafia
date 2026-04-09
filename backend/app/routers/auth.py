# ASSESSMENT: Virtual Identity — Auth router handles registration, login, and JWT cookie issuance.
# ASSESSMENT: Software Design (Low Coupling) — Auth logic isolated in its own router module.
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
import random

from app.database import get_db
from app.models import User
from app.services import heart_api

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = "MOON_MAFIA_SECRET_CHANGE_IN_PROD"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 120


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    age: int
    gender: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    password: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None
    has_seen_tutorial: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    avatar_url: Optional[str] = None
    capital: float
    games_played: int
    total_wins: int
    total_losses: int
    total_rounds: int
    heart_mode_wins: int
    carrot_mode_wins: int
    security_question: Optional[str] = None
    has_seen_tutorial: bool = False

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────
def _create_token(user_id: int) -> str:
    """Build a signed JWT with an expiry claim."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    session_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Extracts the user from the HttpOnly JWT cookie. Shared dependency."""
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new player account with full profile."""
    if db.query(User).filter(User.name == body.name).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        name=body.name,
        age=body.age,
        gender=body.gender,
        password_hash=_hash_password(body.password),
        capital=1000.0,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={body.name}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=UserResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate and set a HttpOnly JWT cookie."""  # ASSESSMENT: Virtual Identity — HttpOnly cookie auth.
    user = db.query(User).filter(User.name == body.username).first()
    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(user.id)

    response.set_cookie(  # ASSESSMENT: Virtual Identity — JWT stored in HttpOnly cookie.
        key="session_token",
        value=token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=TOKEN_EXPIRE_MINUTES * 60,
    )
    return user


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Return the current authenticated user's full profile."""
    return user


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(key="session_token", samesite="none", secure=True)
    return {"status": "logged out"}


@router.patch("/me", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Edit the current user's profile.
    All fields are optional — only provided fields are updated.
    """
    if body.name is not None and body.name != user.name:
        if db.query(User).filter(User.name == body.name).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        user.name = body.name

    if body.age is not None:
        user.age = body.age

    if body.gender is not None:
        user.gender = body.gender

    if body.password is not None:
        user.password_hash = _hash_password(body.password)

    if body.security_question is not None:
        user.security_question = body.security_question

    if body.security_answer is not None:
        user.security_answer = _hash_password(body.security_answer)

    if body.has_seen_tutorial is not None:
        user.has_seen_tutorial = 1 if body.has_seen_tutorial else 0

    db.commit()
    db.refresh(user)
    return user


class SecurityQuestionResponse(BaseModel):
    security_question: Optional[str] = None


@router.get("/security-question/{username}", response_model=SecurityQuestionResponse)
def get_security_question(username: str, db: Session = Depends(get_db)):
    """Fetch the security question for a given username."""
    user = db.query(User).filter(User.name == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"security_question": user.security_question}


class ResetPasswordRequest(BaseModel):
    username: str
    security_answer: str
    new_password: str


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify security answer and reset password."""
    user = db.query(User).filter(User.name == body.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.security_answer or not _verify_password(body.security_answer, user.security_answer):
        raise HTTPException(status_code=401, detail="Invalid security answer")

    user.password_hash = _hash_password(body.new_password)
    db.commit()
    return {"status": "password reset successful"}


@router.delete("/me")
def delete_account(
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete the current user's account.
    Clears the session cookie — frontend should redirect to login.
    """
    db.delete(user)
    db.commit()
    response.delete_cookie(key="session_token", samesite="none", secure=True)
    return {"status": "account deleted"}
    
_QUOTES_CACHE: list[dict] = []

class QuoteResponse(BaseModel):
    content: str
    author: str

@router.get("/quote", response_model=QuoteResponse)
async def get_random_quote():
    """Fetch a random quote from an external API, with in-memory caching and connection pooling."""
    global _QUOTES_CACHE

    if not _QUOTES_CACHE:
        try:
            # Reusing global http_client for connection pooling
            res = await heart_api.http_client.get("https://type.fit/api/quotes", timeout=5.0)
            if res.status_code == 200:
                _QUOTES_CACHE = res.json()
        except Exception:
            # Fallback will be used if cache is empty and fetch fails
            pass

    if _QUOTES_CACHE:
        q = random.choice(_QUOTES_CACHE)
        # Handle cases where author might be null or contains 'type.fit' suffix
        raw_author = q.get("author") or "Unknown"
        author = raw_author.replace(", type.fit", "")
        if author == "type.fit":
            author = "Unknown"
        return QuoteResponse(content=q.get("text", "Greed, for lack of a better word, is good."), author=author)
        
    return QuoteResponse(
        content="Money never sleeps, pal.",
        author="Gordon Gekko"
    )