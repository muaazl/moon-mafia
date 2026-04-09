from __future__ import annotations

# COOLDOWN MESSAGES
COOLDOWN_MESSAGES = {
    "gamble": "High-roller on timeout. Dice are cooling off. Try again in {s}s.",
    "beg":    "Begging again so soon? Even pity has a cooldown. {s}s to go.",
    "search": "You just searched this block. Nothing new grew since then. {s}s left.",
    "fish":   "The fish need time to swim back. Wait {s}s before casting again.",
    "hunt":   "Your target heard you coming. Lay low for {s}s before the next hunt.",
    "loan":   "Your loan broker needs a breather. Come back in {s}s.",
}

# DEBT & LOAN
DEBT_MESSAGES = {
    "NO_DEBT": "No debt. All good.",
    "REPOSSESSED": "You've been repossessed. Assets seized. Reset to $100.",
    "INTEREST_CHARGED": "Debt interest charged: -${interest}. Current balance: ${balance}.",
}

LOAN_MESSAGES = {
    "FLAVOURS": [
        "💵 Your broker came through. Here's ${amount}. Don't blow it all in one place.",
        "🤝 Loan approved — ${amount} wired to your account. Repay whenever.",
        "💸 Funds transferred: ${amount}. The broker says 'You're good for it.'",
        "🏦 Quick loan of ${amount} granted. No collateral needed… this time.",
    ],
    "PAYBACK_SUCCESS": "Loan repaid! ${amount} deducted from your capital.",
    "INSUFFICIENT_FUNDS": "Insufficient funds. You have ${capital} but need ${needed}.",
    "INVALID_AMOUNT": "Repayment amount must be positive.",
}

# GAME OUTCOMES (Resolvers)
GAME_OUTCOMES = {
    "DRAW": {
        "HYPE": "⚖️  Hearts({hearts}) = Carrots({carrots}). The market is perfectly balanced — no gains, no losses.",
        "PURGE": "⚖️  Hearts({hearts}) = Carrots({carrots}). Nothing to purge here. Stand by.",
        "GAMBLE": "⚖️  Hearts and carrots are nearly identical. The market shrugged.",
        "EMPTY_MARKET": "⚖️  Empty market. Nothing to gamble on.",
    },
    "WIN": {
        "HYPE": "🔥 Hearts({hearts}) > Carrots({carrots}). You called it. +${amount}",
        "PURGE": "🐇 Carrots({carrots}) > Hearts({hearts}). Smart dodge — you purged at the right moment. +${amount}",
        "GAMBLE": "📈 Hearts lead! Market favours you. +${amount}",
        "GAMBLE_ZERO_CARROTS": "🚀 Zero carrots in the market. Pure hearts energy. +${amount}",
    },
    "LOSS": {
        "HYPE": "📉 Carrots({carrots}) > Hearts({hearts}). You over-hyped it. -${amount}",
        "PURGE": "💸 Hearts({hearts}) > Carrots({carrots}). Wrong call. Purging cost you -${amount}",
        "GAMBLE": "📉 Carrots lead. You gambled wrong. -${amount}",
    },
    "BET": {
        "JACKPOT": "🎰 JACKPOT! Exact match — Hearts={hearts}, Carrots={carrots}. +${amount} ({mult}x)!",
        "HIT": "✅ Hearts nailed it ({hearts})! +${amount} ({mult}x)!",
        "MISS": "❌ Predicted {predicted} hearts (actual: {actual}). -${amount}",
    },
    "MINI": {
        "BEG_SUCCESS": "🙏 Someone took pity on you. +${amount}",
        "BEG_FAIL": "🚫 Nobody gave you anything.",
        "SEARCH_SUCCESS": "🔍 You scrounged the streets and found ${amount}.",
        "SEARCH_FAIL": "🗑️  Searched high and low. Found nothing but a suspicious receipt.",
        "FISH_SUCCESS": "🐟 Patient as ever. Reeled in ${amount}.",
        "FISH_FAIL": "🎣 The line snapped. Lost your bait and paid a dock fee of ${amount}.",
        "HUNT_SUCCESS": "🏹 Direct hit. Brought home ${amount}. The hunt was worth it.",
        "HUNT_FAIL": "💨 The target got away. Damaged your gear. -${amount}.",
    }
}

# AUDIT
AUDIT_MESSAGES = {
    "SUCCESS": "Vision restored for 3 seconds! Cost: ${cost}.",
    "NO_ROUND": "No active round to audit. Call /game/fetch first.",
    "INSUFFICIENT_FUNDS": "Insufficient funds for audit (${cost} required).",
}
