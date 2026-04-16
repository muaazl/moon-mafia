

def _audit_cost(difficulty: str, stake: float = 200.0) -> int:
    """
    Cost to use the hint (audit). Tied to the player's stake:
      easy   → 50 % of stake (min $50)
      medium → 60 % of stake (min $100)
      hard   → 75 % of stake (min $150)
    This ensures the hint costs roughly half of what the player stands to gain,
    making it meaningful but not game-breaking.
    """
    rates = {"easy": 0.50, "medium": 0.60, "hard": 0.75}
    minimums = {"easy": 50, "medium": 100, "hard": 150}
    rate = rates.get(difficulty, 0.60)
    minimum = minimums.get(difficulty, 100)
    return max(minimum, int(stake * rate))
