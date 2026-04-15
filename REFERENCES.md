# Project References and Acknowledgements

## Project Summary
**Moon Mafia** is a high-stakes betting game where players use their visual skills to predict the number of hearts and carrots in images. Players start with a base capital and aim to grow their wealth through various game modes and mini-games while competing on a global leaderboard.

## External Libraries and Packages

### Backend (Python)
- **FastAPI**: Web framework for building APIs.
- **Uvicorn**: ASGI server for running the FastAPI application.
- **SQLAlchemy**: SQL toolkit and Object Relational Mapper (ORM).
- **psycopg2-binary**: PostgreSQL database adapter.
- **python-dotenv**: Loads environment variables from `.env` files.
- **bcrypt**: Library for hashing passwords.
- **python-jose**: JavaScript Object Signing and Encryption implementation for JWTs.
- **httpx**: Next-generation HTTP client for Python (used for external API calls).
- **pydantic**: Data validation and settings management using Python type annotations.

### Frontend (React/TypeScript)
- **React**: Library for building user interfaces.
- **Vite**: Frontend tooling for fast development and building.
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library for React.
- **Zustand**: Small, fast, and scalable state-management solution.
- **Axios**: Promise-based HTTP client for the browser.
- **Lucide React**: Icon library.
- **Radix UI**: Unstyled, accessible components for building high-quality design systems.
- **Ark UI**: Headless components for building design systems.
- **Recharts**: Composable charting library built on React components.
- **Sonner**: An opinionated toast component for React.
- **Canvas-confetti**: Performant confetti animation library.
- **Next-themes**: Perfect Next.js dark mode and theme management (used in Vite).

## External APIs and Services

| Name | Usage | Location in Code | Type |
|------|-------|------------------|------|
| **Heart API** | Provides game images and solutions (heart/carrot counts). | `backend/app/services/heart_api.py` | API |
| **No Reason API** | Provides snarky reasons for failed "Begging" mini-game actions. | `backend/app/services/heart_api.py` | API |
| **Type.fit Quotes API** | Provides random inspirational quotes for the authentication screen. | `backend/app/routers/auth.py` | API |
| **DiceBear Avatars** | Generates unique bot-style avatars based on usernames. | `backend/app/routers/auth.py` | Service |
| **Google Fonts** | Provides the "Sora" font family for the application UI. | `frontend/index.html` | Service |

## Hosting and Infrastructure References
The project contains configuration and references for:
- **Vercel**: Intended platform for frontend deployment.
- **Render**: Intended platform for backend deployment.

## Development Notes
- **AI Assistance**: This project utilizes specific `ASSESSMENT:` comments throughout the codebase to highlight architectural decisions such as Software Design (Low Coupling/High Cohesion), Interoperability, Event-driven Programming, and Virtual Identity. These patterns and the Bolt performance persona were integrated to demonstrate engineering best practices.
- **Integration**: The final implementation was carefully reviewed, adjusted, and integrated by me to ensure a cohesive and functional application.
- **Originality**: No code from friends or classmates was used in this project. All external tools and borrowed patterns are documented above.
