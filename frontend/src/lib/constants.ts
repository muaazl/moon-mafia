export enum GameDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum GameMode {
  CLASSIC = "classic",
  UNLIMITED = "unlimited",
}

export const DIFFICULTIES = [
  { id: GameDifficulty.EASY, label: "EASY", multiplier: "1.0x", description: "Safe start, normal rewards" },
  { id: GameDifficulty.MEDIUM, label: "MEDIUM", multiplier: "1.5x", description: "Higher risk, better rewards" },
  { id: GameDifficulty.HARD, label: "HARD", multiplier: "2.0x", description: "Maximum risk, double rewards" },
];

export const GAME_MODES = [
  { id: GameMode.CLASSIC, label: "CLASSIC", description: "10 Rounds of strategy" },
  { id: GameMode.UNLIMITED, label: "UNLIMITED", description: "Play as long as you can. Gets harder every round." },
];

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    QUOTE: "/auth/quote",
    SECURITY_QUESTION: (username: string) => `/auth/security-question/${username}`,
    RESET_PASSWORD: "/auth/reset-password",
    ME: "/auth/me",
  },
  GAME: {
    START: "/game/start",
    FETCH: "/game/fetch",
    ACTION: "/game/action",
    AUDIT: "/game/audit",
    FORFEIT: "/game/forfeit",
    LEADERBOARD: "/game/leaderboard",
    TIP: "/game/tip",
  },
  MINI: {
    PLAY: (gameId: string) => `/mini/${gameId}`,
    GAMBLE: "/mini/gamble",
    PAYBACK: "/mini/payback_loan",
    DEBT_TICK: "/mini/debt_tick",
  }
};

export const UI_MESSAGES = {
  MINI: {
    BET_REQUIRED: { title: "Enter amount", description: "You need to bet some money first!" },
    COOLDOWN: (detail: string) => ({ title: "Wait a bit", description: detail }),
    PAYBACK_INSUFFICIENT: (needed: number, have: number) => ({
      title: "Not enough funds",
      description: `You need $${needed.toLocaleString()} to pay back. You have $${have.toLocaleString()}.`
    }),
    PAYBACK_SUCCESS: (amount: number, cleared: number) => ({
      title: "Loan Repaid!",
      description: `You paid back $${amount.toLocaleString()} (2× your $${cleared.toLocaleString()} loan).`
    }),
    DEBT_INTEREST: (amount: number) => ({
      title: "Debt Interest",
      description: `-$${amount} charged. Pay it back!`
    }),
    FAILED: (detail: string) => ({ title: "Failed", description: detail }),
  },
  GAME: {
    FETCH_ERROR: "Failed to fetch market data.",
    ACTION_ERROR: "Network error. Market trade failed.",
    STAKE_REQUIRED: "Enter stake first!",
  }
};
