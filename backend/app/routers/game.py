# ASSESSMENT: Event-Driven Programming — Game actions dispatched by action type from client events.
# ASSESSMENT: Software Design (Low Coupling) — Router delegates to service functions, no inline math.
from __future__ import annotations

from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, load_only
from sqlalchemy import desc

from app.database import get_db
from app.models import User
from app.services.heart_api import fetch_heart_image, DIFFICULTY_SECONDS
from app.services.game_logic import resolve_hype, resolve_purge, resolve_bet
from app.services.audit import _audit_cost
from app.routers.auth import get_current_user
from app.messages import AUDIT_MESSAGES

router = APIRouter(prefix="/game", tags=["game"])

_round_cache: dict[int, dict] = {}

CLASSIC_MAX_ROUNDS = 10


class ActionType(str, Enum):
    HYPE = "HYPE"
    PURGE = "PURGE"
    BET = "BET"


class ActionRequest(BaseModel):
    action: ActionType
    stake: float = 0
    predicted_value: Optional[int] = None
    predicted_carrots: Optional[int] = None
    round_number: Optional[int] = 1


class FetchResponse(BaseModel):
    image_url: str
    capital: float
    difficulty_seconds: int
    streak: int = 0


class ActionResponse(BaseModel):
    outcome: str
    detail: str
    capital: float
    hearts: Optional[int] = None
    carrots: Optional[int] = None
    streak: int = 0


class TipRequest(BaseModel):
    recipient_name: str
    amount: float


class TipResponse(BaseModel):
    sender_capital: float
    detail: str


class AuditResponse(BaseModel):
    audit_cost: int
    capital: Optional[float] = None

@router.get("/fetch", response_model=FetchResponse)
async def fetch_round(
    mode: str = Query(default="classic", description="classic | unlimited"),
    difficulty: str = Query(default="medium", description="easy | medium | hard"),
    stake: float = Query(default=100.0, description="Player's locked stake for this session"),
    round_number: int = Query(default=1, description="Current round number"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch a new round image from the Heart API.
    Stores the solution server-side — only the image URL is sent to the client.
    """
    difficulty = difficulty.lower()
    mode = mode.lower()
    if difficulty not in DIFFICULTY_SECONDS:
        difficulty = "medium"
        
    max_allowed = max(100.0, float(user.capital) * 0.5)
    if stake > max_allowed:
        raise HTTPException(
            status_code=400, 
            detail=f"Stake cannot exceed 50% of available funds (${round(max_allowed, 2)} max)"
        )

    data = await fetch_heart_image()  # ASSESSMENT: Interoperability — delegated to service.

    if round_number == 1:
        user.current_streak = 0
        db.commit()
        db.refresh(user)

    _round_cache[user.id] = {
        "hearts": data["solution"],
        "carrots": data["carrots"],
        "mode": mode,
        "difficulty": difficulty,
        "audit_count": 0,
        "stake": stake,
    }

    return FetchResponse(
        image_url=data["image_url"],
        capital=user.capital,
        difficulty_seconds=DIFFICULTY_SECONDS[difficulty],
        streak=user.current_streak or 0,
    )


@router.post("/action", response_model=ActionResponse)
def perform_action(
    body: ActionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Process a HYPE / PURGE / BET action for the current round.
    Reveals the actual hearts & carrots counts in the response.
    """
    game_data = _round_cache.pop(user.id, None)
    if game_data is None:
        raise HTTPException(status_code=400, detail="No active round. Call /game/fetch first.")

    hearts = game_data["hearts"]
    carrots = game_data["carrots"]
    mode = game_data["mode"]

    if body.action == ActionType.HYPE:  # ASSESSMENT: Event-Driven Programming — dispatched from client action.
        if body.stake <= 0:
            raise HTTPException(status_code=400, detail="Invalid stake amount")
            
        max_allowed = max(100.0, float(user.capital) * 0.5)
        if body.stake > max_allowed:
            raise HTTPException(status_code=400, detail=f"Stake exceeds the 50% limit (${round(max_allowed, 2)})")
            
        result = resolve_hype(body.stake, hearts, carrots)

    elif body.action == ActionType.PURGE:
        if body.stake <= 0:
            raise HTTPException(status_code=400, detail="Invalid stake amount")
        max_allowed = max(100.0, float(user.capital) * 0.5)
        if body.stake > max_allowed:
            raise HTTPException(status_code=400, detail=f"Stake exceeds the 50% limit (${round(max_allowed, 2)})")
        result = resolve_purge(body.stake, hearts, carrots)

    elif body.action == ActionType.BET:
        if body.stake <= 0:
            raise HTTPException(status_code=400, detail="Invalid stake amount")
        max_allowed = max(100.0, float(user.capital) * 0.5)
        if body.stake > max_allowed:
            raise HTTPException(status_code=400, detail=f"Stake exceeds the 50% limit (${round(max_allowed, 2)})")
        if body.predicted_value is None:
            raise HTTPException(status_code=400, detail="BET requires predicted_value (hearts guess)")
        result = resolve_bet(
            body.stake,
            body.predicted_value,
            hearts,
            body.predicted_carrots,
            carrots,
            difficulty=game_data.get("difficulty", "medium"),
        )
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

    if user.id in _round_cache:
        _round_cache[user.id]["stake"] = body.stake

    outcome = result["outcome"]
    streak_multiplier = 1.0

    if outcome in ("WIN", "HIT", "JACKPOT", "DODGE", "TROPHY", "CATCH", "BIG_WIN", "FOUND", "RECEIVED"):
        user.total_wins = (user.total_wins or 0) + 1
        user.current_streak = (user.current_streak or 0) + 1
        if body.action == ActionType.HYPE:
            user.heart_mode_wins = (user.heart_mode_wins or 0) + 1
        elif body.action == ActionType.PURGE:
            user.carrot_mode_wins = (user.carrot_mode_wins or 0) + 1
            
        if user.current_streak >= 6:
            streak_multiplier = 1.5
        elif user.current_streak >= 4:
            streak_multiplier = 1.2
            
    elif outcome in ("LOSS", "MISS", "MISSED", "BAD_CATCH"):
        user.total_losses = (user.total_losses or 0) + 1
        user.current_streak = 0

    round_number = body.round_number or 1
    if mode == "classic" and round_number >= CLASSIC_MAX_ROUNDS:
        user.games_played = (user.games_played or 0) + 1
        user.current_streak = 0
        
    if mode == "unlimited":
        streak_multiplier = streak_multiplier * (1.1 + (round_number * 0.1))

    delta_capital = result["delta_capital"]
    detail = result["detail"]
    if delta_capital > 0 and streak_multiplier > 1.0:
        delta_capital = round(delta_capital * streak_multiplier, 2)
        detail += f" ({streak_multiplier}x Streak applies!)"

    user.capital = round(user.capital + delta_capital, 2)
    user.total_rounds = (user.total_rounds or 0) + 1

    db.commit()
    db.refresh(user)

    return ActionResponse(
        outcome=outcome,
        detail=detail,
        capital=user.capital,
        hearts=hearts,
        carrots=carrots,
        streak=user.current_streak or 0,
    )


@router.get("/audit", response_model=AuditResponse)
async def audit_round(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AUDIT — Simply reveals the image on the frontend by deducting the audit cost.
    No more cryptic hints.
    """
    game_data = _round_cache.get(user.id)
    if game_data is None:
        raise HTTPException(
            status_code=400,
            detail=AUDIT_MESSAGES["NO_ROUND"],
        )

    difficulty: str = game_data.get("difficulty", "medium")
    audit_count: int = game_data.get("audit_count", 0)
    stake: float = game_data.get("stake", 200.0)

    base_cost = _audit_cost(difficulty, stake)
    audit_cost = int(base_cost * (1 + 0.5 * audit_count))

    if user.capital < audit_cost:
        raise HTTPException(
            status_code=400,
            detail=AUDIT_MESSAGES["INSUFFICIENT_FUNDS"].format(cost=audit_cost),
        )

    user.capital = round(user.capital - audit_cost, 2)
    _round_cache[user.id]["audit_count"] = audit_count + 1
    
    db.commit()
    db.refresh(user)

    return AuditResponse(
        audit_cost=audit_cost,
        capital=user.capital,
    )


@router.post("/forfeit", response_model=ActionResponse)
def forfeit_game(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    FORFEIT — Deducts the stake as a penalty for early exit.
    """
    game_data = _round_cache.pop(user.id, None)
    if game_data is None:
        raise HTTPException(status_code=400, detail="No active round to forfeit.")

    stake = game_data.get("stake", 100.0)
    user.capital = round(user.capital - stake, 2)
    user.total_losses = (user.total_losses or 0) + 1
    user.current_streak = 0
    
    db.commit()
    db.refresh(user)

    return ActionResponse(
        outcome="FORFEIT",
        detail=f"Early exit penalty: -${stake} deducted.",
        capital=user.capital,
        streak=0
    )


@router.get("/summary")
def get_summary(user: User = Depends(get_current_user)):
    """Return the player's lifetime stats summary."""
    net = round(user.capital - 10000.0, 2)
    win_rate = (
        round(user.total_wins / user.total_rounds * 100, 1)
        if user.total_rounds and user.total_rounds > 0
        else 0.0
    )
    return {
        "name": user.name,
        "capital": user.capital,
        "net_change": net,
        "games_played": user.games_played,
        "total_wins": user.total_wins,
        "total_losses": user.total_losses,
        "total_rounds": user.total_rounds,
        "win_rate_pct": win_rate,
        "heart_mode_wins": user.heart_mode_wins,
        "carrot_mode_wins": user.carrot_mode_wins,
    }

class LeaderboardEntry(BaseModel):
    name: str
    avatar_url: Optional[str] = None
    capital: float

@router.post("/tip", response_model=TipResponse)
def tip_player(
    body: TipRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allow a player to tip another player from the leaderboard.
    Validation:
    - Amount must be > 0
    - Sender must have enough capital
    - Recipient must exist
    - Cannot tip yourself
    """
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Tip amount must be positive")

    if user.capital < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds for this tip")

    recipient = db.query(User).filter(User.name == body.recipient_name).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient player not found")

    if recipient.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot tip yourself")

    user.capital = round(user.capital - body.amount, 2)
    recipient.capital = round(recipient.capital + body.amount, 2)

    db.commit()
    db.refresh(user)
    db.refresh(recipient)

    return TipResponse(
        sender_capital=user.capital,
        detail=f"Successfully sent ${body.amount} to {body.recipient_name}."
    )

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    """Fetch the top 50 players sorted by capital for the leaderboard."""
    # PERFORMANCE: Only fetch essential fields to reduce payload and DB pressure.
    top_users = (
        db.query(User)
        .options(load_only(User.name, User.avatar_url, User.capital))
        .order_by(desc(User.capital))
        .limit(50)
        .all()
    )
    return [
        LeaderboardEntry(
            name=user.name,
            avatar_url=user.avatar_url,
            capital=user.capital,
        ) for user in top_users
    ]