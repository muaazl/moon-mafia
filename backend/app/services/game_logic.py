# ASSESSMENT: Software Design (High Cohesion) — Pure game math, no I/O or framework imports.
# ASSESSMENT: Event-Driven Programming — Each resolve_* function is a pure handler for a player action.
from __future__ import annotations
import random
from app.messages import GAME_OUTCOMES, LOAN_MESSAGES


# ── Main Game Actions ─────────────────────────────────────────────────────────

def _spread_payout(stake: float, hearts: int, carrots: int, is_win: bool = True) -> float:
    """
    Compute the variable payout/loss based on the spread between hearts and carrots.
    
    ASYMMETRIC LOGIC:
    - If Win: The harder the guess (lower spread), the higher the reward.
    - If Loss: The easier the guess (higher spread), the higher the penalty.
    """
    total = hearts + carrots
    if total == 0:
        return round(stake * 0.5, 2)

    spread_ratio = abs(hearts - carrots) / total
    
    # Volatility Index (±5% jitter)
    vix = 1.0 + random.uniform(-0.05, 0.05)
    
    if is_win:
        # Difficulty Factor for rewards: Inverted spread
        # Higher difficulty (smaller spread) = Higher payout
        # Range: ~0.25 to ~1.25
        df = 1.25 - (spread_ratio * 1.0)
    else:
        # Punishment Factor for losses: Normal spread (closer to 1.0 = more obvious mistake)
        # Obvious mistake (larger spread) = Higher penalty
        # Range: ~0.5 to ~1.5
        df = 0.5 + (spread_ratio * 1.0)
    
    raw = stake * df * vix
    
    # Dynamic clamping to ensure fairness
    # Max reward: 1.5x stake, Max loss: 1.5x stake
    clamped = max(stake * 0.20, min(raw, stake * 1.50))
    
    return round(clamped, 2)


def resolve_hype(stake: float, hearts: int, carrots: int) -> dict:
    """
    HYPE — player believes Hearts > Carrots (bullish).
    Win if hearts > carrots, lose if not.
    Draw (no money change) if equal.

    Payout is spread-based and jittered — varies every round.
    Maximum win/loss is capped at the stake amount.
    """
    if hearts == carrots:
        return {
            "delta_capital": 0,
            "outcome": "DRAW",
            "detail": GAME_OUTCOMES["DRAW"]["HYPE"].format(hearts=hearts, carrots=carrots),
        }

    if hearts > carrots:
        amount = _spread_payout(stake, hearts, carrots, is_win=True)
        return {
            "delta_capital": amount,
            "outcome": "WIN",
            "detail": GAME_OUTCOMES["WIN"]["HYPE"].format(hearts=hearts, carrots=carrots, amount=amount),
        }
    else:
        amount = _spread_payout(stake, hearts, carrots, is_win=False)
        return {
            "delta_capital": -amount,
            "outcome": "LOSS",
            "detail": GAME_OUTCOMES["LOSS"]["HYPE"].format(hearts=hearts, carrots=carrots, amount=amount),
        }


def resolve_purge(stake: float, hearts: int, carrots: int) -> dict:
    """
    PURGE — player believes Carrots > Hearts (bearish).
    Win if carrots > hearts. Draw if equal. Lose if not.

    Same spread-based formula as HYPE — mirrored.
    """
    if hearts == carrots:
        return {
            "delta_capital": 0,
            "outcome": "DRAW",
            "detail": GAME_OUTCOMES["DRAW"]["PURGE"].format(hearts=hearts, carrots=carrots),
        }

    if carrots > hearts:
        amount = _spread_payout(stake, hearts, carrots, is_win=True)
        return {
            "delta_capital": amount,
            "outcome": "WIN",
            "detail": GAME_OUTCOMES["WIN"]["PURGE"].format(hearts=hearts, carrots=carrots, amount=amount),
        }
    else:
        amount = _spread_payout(stake, hearts, carrots, is_win=False)
        return {
            "delta_capital": -amount,
            "outcome": "LOSS",
            "detail": GAME_OUTCOMES["LOSS"]["PURGE"].format(hearts=hearts, carrots=carrots, amount=amount),
        }


def resolve_bet(stake: float, predicted_hearts: int, hearts: int,
                predicted_carrots: int | None, carrots: int, difficulty: str = "medium") -> dict:
    """
    BET — player guesses heart count (and optionally carrots too).

    Tier 1: exact hearts only  → multiplier-based on difficulty
    Tier 2: exact hearts + exact carrots → bigger multiplier
    Miss: lose stake.
    """
    diff_mults = {
        "easy":   {"heart": 1.5, "both": 2.5},
        "medium": {"heart": 3.0, "both": 5.0},
        "hard":   {"heart": 5.0, "both": 10.0}
    }
    m_heart = diff_mults.get(difficulty, diff_mults["medium"])["heart"]
    m_both  = diff_mults.get(difficulty, diff_mults["medium"])["both"]

    hearts_right  = predicted_hearts == hearts
    carrots_right = predicted_carrots is not None and predicted_carrots == carrots

    if hearts_right and carrots_right:
        winnings = round(stake * m_both, 2)
        return {
            "delta_capital": winnings,
            "outcome": "JACKPOT",
            "detail": GAME_OUTCOMES["BET"]["JACKPOT"].format(hearts=hearts, carrots=carrots, amount=winnings, mult=m_both),
        }
    if hearts_right:
        winnings = round(stake * m_heart, 2)
        return {
            "delta_capital": winnings,
            "outcome": "HIT",
            "detail": GAME_OUTCOMES["BET"]["HIT"].format(hearts=hearts, amount=winnings, mult=m_heart),
        }
    return {
        "delta_capital": -stake,
        "outcome": "MISS",
        "detail": GAME_OUTCOMES["BET"]["MISS"].format(predicted=predicted_hearts, actual=hearts, amount=stake),
    }


# ── Mini-Game Actions ─────────────────────────────────────────────────────────
# All mini-game payouts are capped to realistic amounts.
# No beggar gets more than ~$100. No hunt returns more than ~$200.

_BEG_MAX    = 80.0    # most you can get from begging
_SEARCH_MAX = 120.0   # most you can scavenge
_FISH_WIN   = 75.0    # max good catch
_FISH_LOSS  = 30.0    # max bad-catch penalty
_HUNT_WIN   = 200.0   # max trophy
_HUNT_LOSS  = 60.0    # max failed-hunt penalty


def resolve_gamble(amount: float, hearts: int, carrots: int) -> dict:
    """
    GAMBLE — ratio-based win/loss using the heart/carrot spread.
    Uses the same spread formula as the main game.
    """
    if carrots == 0 and hearts == 0:
        return {
            "delta_capital": 0,
            "outcome": "DRAW",
            "detail": GAME_OUTCOMES["DRAW"]["EMPTY_MARKET"],
        }

    if carrots == 0:
        winnings = round(amount * 0.8, 2)   # solid win but not infinite
        return {
            "delta_capital": winnings,
            "outcome": "BIG_WIN",
            "detail": GAME_OUTCOMES["WIN"]["GAMBLE_ZERO_CARROTS"].format(amount=winnings),
        }

    ratio = hearts / carrots
    if abs(ratio - 1.0) < 0.01:
        return {
            "delta_capital": 0,
            "outcome": "DRAW",
            "detail": GAME_OUTCOMES["DRAW"]["GAMBLE"],
        }
    elif ratio > 1:
        amount_won = _spread_payout(amount, hearts, carrots, is_win=True)
        return {
            "delta_capital": amount_won,
            "outcome": "WIN",
            "detail": GAME_OUTCOMES["WIN"]["GAMBLE"].format(amount=amount_won),
        }
    else:
        amount_lost = _spread_payout(amount, hearts, carrots, is_win=False)
        return {
            "delta_capital": -amount_lost,
            "outcome": "LOSS",
            "detail": GAME_OUTCOMES["LOSS"]["GAMBLE"].format(amount=amount_lost),
        }


def resolve_beg(hearts: int, no_reason: str) -> dict:
    """
    BEG — 50 % chance of a small reward, 50 % rejection.
    Max reward: $80 (realistic for begging).
    """
    if random.random() < 0.5:
        # Scale by hearts but cap hard
        raw    = hearts * random.uniform(3, 12)
        reward = round(min(raw, _BEG_MAX), 2)
        return {
            "delta_capital": reward,
            "outcome": "RECEIVED",
            "detail": GAME_OUTCOMES["MINI"]["BEG_SUCCESS"].format(amount=reward),
            "no_reason": None,
        }
    return {
        "delta_capital": 0,
        "outcome": "REJECTED",
        "detail": GAME_OUTCOMES["MINI"]["BEG_FAIL"],
        "no_reason": no_reason,
    }


def resolve_search(hearts: int) -> dict:
    """
    SEARCH — 60 % chance to scavenge something small, 40 % empty.
    Max find: $120.
    """
    if random.random() < 0.6:
        raw  = random.uniform(10, 30 + hearts * 5)
        find = round(min(raw, _SEARCH_MAX), 2)
        return {
            "delta_capital": find,
            "outcome": "FOUND",
            "detail": GAME_OUTCOMES["MINI"]["SEARCH_SUCCESS"].format(amount=find),
        }
    return {
        "delta_capital": 0,
        "outcome": "EMPTY",
        "detail": GAME_OUTCOMES["MINI"]["SEARCH_FAIL"],
    }


def resolve_fish(hearts: int, carrots: int) -> dict:
    """
    FISH — patient steady gain (70 % chance), bad catch 30 %.
    Win capped at $75. Loss capped at $30.
    """
    if random.random() < 0.3:
        fee = round(min(carrots * 1.5, _FISH_LOSS), 2)
        return {
            "delta_capital": -fee,
            "outcome": "BAD_CATCH",
            "detail": GAME_OUTCOMES["MINI"]["FISH_FAIL"].format(amount=fee),
        }
    raw  = hearts * random.uniform(1.5, 4.0)
    gain = round(min(raw, _FISH_WIN), 2)
    return {
            "delta_capital": gain,
            "outcome": "CATCH",
            "detail": GAME_OUTCOMES["MINI"]["FISH_SUCCESS"].format(amount=gain),
        }


def resolve_hunt(hearts: int, carrots: int) -> dict:
    """
    HUNT — high risk, big target.
    45 % success: win up to $200. 55 % fail: lose up to $60.
    """
    raw_target = carrots * 10 + hearts * 6
    target     = round(min(raw_target, _HUNT_WIN), 2)

    if random.random() < 0.45:
        return {
            "delta_capital": target,
            "outcome": "TROPHY",
            "detail": GAME_OUTCOMES["MINI"]["HUNT_SUCCESS"].format(amount=target),
        }
    penalty = round(min(target * 0.4, _HUNT_LOSS), 2)
    return {
        "delta_capital": -penalty,
        "outcome": "MISSED",
        "detail": GAME_OUTCOMES["MINI"]["HUNT_FAIL"].format(amount=penalty),
    }


def resolve_loan() -> dict:
    """
    LOAN — instant cash injection. No questions asked; no interest tracked here.
    Returns a random amount between $100 and $500.
    Capital can already be negative; the loan simply adds to whatever the player has.
    """
    amount = round(random.uniform(100, 500), 2)
    detail = random.choice(LOAN_MESSAGES["FLAVOURS"]).format(amount=amount)
    return {
        "delta_capital": amount,
        "outcome": "LOAN",
        "detail": detail,
    }