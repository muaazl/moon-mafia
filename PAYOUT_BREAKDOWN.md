# Payout Breakdown 💰

This document details the internal logic and calculations used for payouts, rewards, and penalties in Moon Mafia.

## 1. The Spread Payout Formula (`_spread_payout`)

Most betting actions (**Hype**, **Purge**, and **Gamble**) use a dynamic calculation based on the "spread" between hearts and carrots.

### Variables
- **Spread Ratio**: `abs(hearts - carrots) / (hearts + carrots)`
- **Volatility Index (VIX)**: A random jitter of ±5% (`0.95` to `1.05`).
- **Difficulty Factor (DF)**:
  - **On Win**: `1.25 - spread_ratio`. (Winning on a small spread pays more because it's harder to call).
  - **On Loss**: `0.5 + spread_ratio`. (Losing on a large spread penalizes more because the mistake was "obvious").

### Calculation
`Raw Amount = Stake * Difficulty Factor * Volatility Index`

### Limits
All spread-based payouts are clamped to ensure fairness:
- **Minimum**: 20% of stake.
- **Maximum**: 150% of stake.

---

## 2. Main Game Actions

### Hype & Purge
- **Hype**: Win if `Hearts > Carrots`.
- **Purge**: Win if `Carrots > Hearts`.
- **Draw**: If `Hearts == Carrots`, capital does not change.
- **Payout**: Calculated using the **Spread Payout Formula** above.

### Precision Betting (BET)
Players guess the exact number of hearts (and optionally carrots). Payouts are based on fixed multipliers and difficulty settings:

| Difficulty | Hearts Only (Hit) | Both Correct (Jackpot) |
| :--- | :--- | :--- |
| **Easy** | 1.5x | 2.5x |
| **Medium** | 3.0x | 5.0x |
| **Hard** | 5.0x | 10.0x |

*Note: If you miss the heart count entirely, the full stake is lost.*

---

## 3. Mini-Games

Mini-games have hard-capped rewards to keep the economy stable.

| Game | Success Rate | Max Win | Max Loss | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Gamble** | Ratio-based | 1.5x Stake | 1.5x Stake | Uses the Spread Payout Formula. |
| **Beg** | 50% | $80.00 | $0.00 | Scaled by heart count. |
| **Search** | 60% | $120.00 | $0.00 | Scavenging for scraps. |
| **Fish** | 70% | $75.00 | $30.00 | Patient gain or bad catch. |
| **Hunt** | 45% | $200.00 | $60.00 | High risk, high reward. |
| **Loan** | 100% | $500.00 | N/A | Instant cash ($100 - $500). |

---

## 4. Multipliers & Scaling

### Streak Multipliers
Winning multiple rounds in a row grants a bonus to your earnings:
- **4+ Wins**: 1.2x Multiplier.
- **6+ Wins**: 1.5x Multiplier.

### Unlimited Mode Scaling
In Unlimited mode, a time-based multiplier is applied to increase the stakes as the game progresses:
`Scale = (1.1 + (Round Number * 0.1))`

---

## 5. Debt & Repossession

If your capital falls below **$0.00**, you are in debt.

- **Interest**: Every 30 seconds, **5% interest** is charged on your total debt.
  - Minimum charge: $10.00
  - Maximum charge: $500.00
- **Repossession**: If your capital hits **-$5,000.00**, the Mafia repossesses your assets.
  - Your capital is reset to **$100.00**.
  - You lose all previous progress.
