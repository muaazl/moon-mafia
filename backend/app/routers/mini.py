# ASSESSMENT: Software Design (Low Coupling) — Mini-game logic isolated from main game router.
# ASSESSMENT: Event-Driven Programming — Each endpoint is triggered by a distinct player action type.
from __future__ import annotations
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.heart_api import fetch_heart_image, fetch_no_reason
from app.services.game_logic import (
    resolve_gamble, resolve_beg, resolve_search, resolve_fish, resolve_hunt, resolve_loan
)
from app.routers.auth import get_current_user
from app.messages import COOLDOWN_MESSAGES, DEBT_MESSAGES, LOAN_MESSAGES

router = APIRouter(prefix="/mini", tags=["mini-games"])

# ── Burst Cooldown Config ─────────────────────────────────────────────────────
# Each game allows BURST_LIMIT plays in quick succession.
# Once the burst is exhausted, the player must wait COOLDOWN_SECONDS before playing again.
# After the cooldown the burst counter resets.

BURST_LIMIT: dict[str, int] = {
    "gamble": 3,
    "beg":    2,
    "search": 2,
    "fish":   2,
    "hunt":   2,
    "loan":   1,
}

COOLDOWN_SECONDS: dict[str, int] = {
    "gamble": 20,
    "beg":    45,
    "search": 35,
    "fish":   60,
    "hunt":   40,
    "loan":   90,
}

# State: { user_id: { game: { count: int, window_start: float, cooldown_start: float | None } } }
_bursts: dict[int, dict[str, dict]] = {}


def _check_cooldown(user_id: int, game: str) -> None:
    """
    Burst-based cooldown guard.
    - Tracks how many times a user has played a game without a break.
    - Once burst is exhausted, enforces a cooldown period.
    - After cooldown, the burst counter resets automatically.
    """
    now = time.time()
    user_state = _bursts.setdefault(user_id, {})
    state = user_state.setdefault(game, {"count": 0, "cooldown_start": None})

    limit    = BURST_LIMIT[game]
    cd_secs  = COOLDOWN_SECONDS[game]

    # If a cooldown is active, check whether it has expired
    if state["cooldown_start"] is not None:
        elapsed = now - state["cooldown_start"]
        remaining = cd_secs - elapsed
        if remaining > 0:
            msg = COOLDOWN_MESSAGES[game].format(s=int(remaining) + 1)
            raise HTTPException(status_code=429, detail=msg)
        # Cooldown expired — reset burst
        state["count"] = 0
        state["cooldown_start"] = None

    # Increment play count
    state["count"] += 1

    # If burst is now exhausted, start a cooldown
    if state["count"] >= limit:
        state["cooldown_start"] = now


def _commit_delta(user: User, delta: float, db: Session) -> None:
    user.capital = round(user.capital + delta, 2)
    db.commit()
    db.refresh(user)


# ── Schemas ───────────────────────────────────────────────────────────────────
class GambleRequest(BaseModel):
    amount: float


class MiniResponse(BaseModel):
    outcome: str
    detail: str
    capital: float
    no_reason: Optional[str] = None
    hearts: Optional[int] = None
    carrots: Optional[int] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/gamble", response_model=MiniResponse)
async def mini_gamble(
    body: GambleRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ratio-based gamble using the live heart/carrot count. Capital can go negative."""
    _check_cooldown(user.id, "gamble")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Bet must be a positive amount.")

    data = await fetch_heart_image()
    hearts, carrots = data["solution"], data["carrots"]
    result = resolve_gamble(body.amount, hearts, carrots)

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
        hearts=hearts,
        carrots=carrots,
    )


@router.post("/beg", response_model=MiniResponse)
async def mini_beg(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Beg for money — 50/50 chance. On rejection, hear a snarky 'No'."""
    _check_cooldown(user.id, "beg")

    data = await fetch_heart_image()
    hearts = data["solution"]
    no_reason = await fetch_no_reason()
    result = resolve_beg(hearts, no_reason)

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
        no_reason=result.get("no_reason"),
        hearts=hearts,
    )


@router.post("/search", response_model=MiniResponse)
async def mini_search(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Scavenge the streets for scraps."""
    _check_cooldown(user.id, "search")

    data = await fetch_heart_image()
    hearts = data["solution"]
    result = resolve_search(hearts)

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
        hearts=hearts,
    )


@router.post("/fish", response_model=MiniResponse)
async def mini_fish(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Patient capital accrual — or a bad catch."""
    _check_cooldown(user.id, "fish")

    data = await fetch_heart_image()
    hearts, carrots = data["solution"], data["carrots"]
    result = resolve_fish(hearts, carrots)

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
        hearts=hearts,
        carrots=carrots,
    )


@router.post("/hunt", response_model=MiniResponse)
async def mini_hunt(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """High-risk, high-reward target."""
    _check_cooldown(user.id, "hunt")

    data = await fetch_heart_image()
    hearts, carrots = data["solution"], data["carrots"]
    result = resolve_hunt(hearts, carrots)

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
        hearts=hearts,
        carrots=carrots,
    )


@router.post("/loan", response_model=MiniResponse)
async def mini_loan(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Take out a quick loan — instant cash, but you'll owe it back in karma."""
    _check_cooldown(user.id, "loan")

    result = resolve_loan()

    _commit_delta(user, result["delta_capital"], db)
    return MiniResponse(
        outcome=result["outcome"],
        detail=result["detail"],
        capital=user.capital,
    )


# ── Debt Interest Schema ──────────────────────────────────────────────────────

class DebtTickResponse(BaseModel):
    capital: float
    interest_charged: float
    bust: bool
    detail: str


DEBT_BUST_FLOOR   = -5000.0   # if capital <= this, trigger repossession
DEBT_RESET_AMOUNT =   100.0   # capital after repossession
DEBT_RATE         =   0.05    # 5 % interest per tick
DEBT_MIN_CHARGE   =   10.0
DEBT_MAX_CHARGE   =  500.0


@router.post("/debt_tick", response_model=DebtTickResponse)
async def mini_debt_tick(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called by the frontend every 30 s while user.capital < 0.
    Applies interest on the debt. If capital hits DEBT_BUST_FLOOR, repossession occurs
    and capital is reset to DEBT_RESET_AMOUNT.
    """
    if user.capital >= 0:
        return DebtTickResponse(
            capital=user.capital,
            interest_charged=0,
            bust=False,
            detail=DEBT_MESSAGES["NO_DEBT"],
        )

    # Repossession check — already past the floor
    if user.capital <= DEBT_BUST_FLOOR:
        delta = DEBT_RESET_AMOUNT - user.capital  # bring back up to 100
        user.capital = DEBT_RESET_AMOUNT
        db.commit()
        db.refresh(user)
        return DebtTickResponse(
            capital=user.capital,
            interest_charged=0,
            bust=True,
            detail=DEBT_MESSAGES["REPOSSESSED"],
        )

    # Interest on current debt
    debt = abs(user.capital)
    raw_interest = round(debt * DEBT_RATE, 2)
    interest = max(DEBT_MIN_CHARGE, min(raw_interest, DEBT_MAX_CHARGE))

    user.capital = round(user.capital - interest, 2)
    db.commit()
    db.refresh(user)

    # Check if repossession floor was crossed after this tick
    bust = user.capital <= DEBT_BUST_FLOOR
    if bust:
        delta = DEBT_RESET_AMOUNT - user.capital
        user.capital = DEBT_RESET_AMOUNT
        db.commit()
        db.refresh(user)

    return DebtTickResponse(
        capital=user.capital,
        interest_charged=interest,
        bust=bust,
        detail=(
            DEBT_MESSAGES["REPOSSESSED"]
            if bust
            else DEBT_MESSAGES["INTEREST_CHARGED"].format(interest=interest, balance=user.capital)
        ),
    )


# ── Loan Payback ──────────────────────────────────────────────────────────────

class PaybackLoanRequest(BaseModel):
    amount: float


class PaybackLoanResponse(BaseModel):
    capital: float
    repaid: float
    detail: str


@router.post("/payback_loan", response_model=PaybackLoanResponse)
async def payback_loan(
    body: PaybackLoanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deduct the loan repayment (2× amount) from the player's capital.
    No cooldown — this is a voluntary repayment action.
    """
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail=LOAN_MESSAGES["INVALID_AMOUNT"])

    repay = round(body.amount, 2)

    if user.capital < repay:
        raise HTTPException(
            status_code=400,
            detail=LOAN_MESSAGES["INSUFFICIENT_FUNDS"].format(capital=user.capital, needed=repay)
        )

    _commit_delta(user, -repay, db)

    # Clear the loan burst cooldown so they can take another one immediately if they paid back
    if user.id in _bursts and "loan" in _bursts[user.id]:
        del _bursts[user.id]["loan"]

    return PaybackLoanResponse(
        capital=user.capital,
        repaid=repay,
        detail=LOAN_MESSAGES["PAYBACK_SUCCESS"].format(amount=repay),
    )
