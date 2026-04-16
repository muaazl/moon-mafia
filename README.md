# Moon Mafia 🌙🐰

Welcome to **Moon Mafia**, a high-stakes betting game where your eyes are your best asset! Predict the count of hearts and carrots in images to grow your capital and climb the leaderboard.

## How it Works

The core of the game is simple:
1. **Get Started**: Every new player starts with **$1,000**.
2. **The Goal**: Grow your capital by correctly predicting the contents of "Heart API" images.
3. **Game Modes**:
   - **Classic Mode**: A fixed 10-round session.
   - **Unlimited Mode**: Keep playing as long as you can handle the pressure!
4. **Mini-Games**: If you're short on cash or just feeling lucky, try mini-games like Begging, Fishing, or Hunting to boost your balance.

## Key Features

- **Hype & Purge**: Bet on whether there are more Hearts (Hype) or more Carrots (Purge).
- **Precision Betting**: Guess the exact number of hearts or carrots for massive multipliers.
- **Streaks**: Win consecutive rounds to trigger payout multipliers (up to 1.5x!).
- **Leaderboard**: Compete against other players to see who can amass the most wealth.
- **Mini-Games**: A variety of ways to earn (or lose) money outside the main game.
- **Debt System**: Be careful! If your capital goes negative, interest will accumulate.

## Tech Stack

- **Backend**: Python with [FastAPI](https://fastapi.tiangolo.com/), SQLAlchemy, and SQLite/PostgreSQL.
- **Frontend**: React with [Vite](https://vitejs.dev/), Tailwind CSS, and Framer Motion.

## Getting Started

### Backend Setup
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Start server: `uvicorn app.main:app --reload`.

### Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `pnpm install`.
3. Start dev server: `pnpm dev`.

## References and Acknowledgements
This project utilizes several external libraries, APIs, and services to deliver a rich gaming experience. For a detailed list of all third-party tools and acknowledgements, please refer to the [REFERENCES.md](./REFERENCES.md) file.

---
*Happy Betting! Don't let the Moon Mafia catch you slippin'.*
