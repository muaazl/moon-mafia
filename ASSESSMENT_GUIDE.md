# Moon Mafia: Architectural Assessment & Video Script

This guide provides a structured script and technical deep-dive into the four core architectural pillars of the **Moon Mafia** project: **Software Design Principles**, **Interoperability**, **Event-Driven Programming**, and **Virtual Identity**.

---

## 🎥 Video Introduction (0:00 - 1:00)

**Host:** "Welcome to this architectural deep-dive into Moon Mafia. Today, we're exploring how we built a high-stakes strategy game using modern engineering principles. We'll look at how we kept our code clean, how we talk to external systems, how we handle real-time events, and how we manage user identity securely."

---

## 🏛️ Topic 1: Software Design Principles (1:00 - 3:30)
### Focus: High Cohesion & Low Coupling

**Talking Points:**
*   **High Cohesion:** Every module does one thing and does it well.
*   **Low Coupling:** Components depend on abstractions, not implementations. This makes the system easier to test and modify.

#### Behind the Scenes:
In the backend, we use **Pure Service Layers**. Our `game_logic.py` contains only the "math" of the game. It doesn't know about databases or HTTP requests.

```python
# backend/app/services/game_logic.py
# ASSESSMENT: Software Design (High Cohesion) — Pure game math, no I/O or framework imports.

def resolve_hype(stake: float, hearts: int, carrots: int) -> dict:
    if hearts == carrots:
        return {"delta_capital": 0, "outcome": "DRAW", ...}
    # ... logic for win/loss
```

In the frontend, we use **Encapsulated Components**. The `AnimatedCounter` handles its own animation logic locally, keeping the parent screen clean.

```tsx
// frontend/src/app/screens/MainGameScreen.tsx
// ASSESSMENT: Software Design (High Cohesion) — Reusable counter component with local animation logic.
const AnimatedCounter = memo(({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  // ... local requestAnimationFrame logic
  return <span>{prefix}{formatNumber(displayValue)}</span>;
});
```

**Script Tip:** Mention how the `main.py` only composes routers, acting as a "glue" layer rather than holding business logic. This is the definition of Low Coupling.

---

## 🌐 Topic 2: Interoperability (3:30 - 5:30)
### Focus: External Integrations & Cross-System Communication

**Talking Points:**
*   How the system communicates with external 3rd-party APIs.
*   The bridge between the React frontend and FastAPI backend using standardized JSON.

#### Behind the Scenes:
We isolated external dependencies in `heart_api.py`. If the external provider changes their API, we only update this one file.

```python
# backend/app/services/heart_api.py
# ASSESSMENT: Interoperability — External API calls isolated in service modules.
async def fetch_heart_image() -> dict:
    response = await http_client.get(HEART_API_URL)
    data = response.json()
    return {
        "image_url": data.get("question", ""),
        "solution": int(data.get("solution", 0)),
        "carrots": int(data.get("carrots", 0)),
    }
```

On the frontend, interoperability is maintained via a centralized Axios instance that handles CORS and credentials globally.

```typescript
// frontend/src/lib/api.ts
// ASSESSMENT: Interoperability — Axios instance configured for cross-origin communication.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});
```

**Script Tip:** Highlight the Leaderboard endpoint. It returns JSON, which means *any* client (mobile, web, or CLI) could display our rankings.

---

## ⚡ Topic 3: Event-Driven Programming (5:30 - 8:00)
### Focus: Reactive UI & Lifecycle Events

**Talking Points:**
*   The application reacts to user actions and system state changes.
*   Using event listeners and hooks to create a "living" UI.

#### Behind the Scenes:
We handle **App Lifecycle Events** using FastAPI's `lifespan`. This ensures the database is ready and HTTP clients are warmed up before the first request arrives.

```python
# backend/app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI): # ASSESSMENT: Event-Driven Programming
    fix_postgres_sequences() # Startup event
    yield
    await heart_api.http_client.aclose() # Shutdown event
```

In the frontend, we use **Interaction Triggers**. For example, background music can't play until the user interacts with the page (a browser requirement). We "listen" for the first click to fire the audio engine.

```tsx
// frontend/src/app/App.tsx
// ASSESSMENT: Event-Driven Programming — Audio start triggered by first user interaction.
const handleInteraction = () => {
  if (pendingPlay.current) {
    startTrack();
  }
};
window.addEventListener('click', handleInteraction, { once: true });
```

**Script Tip:** Talk about the `img.onload` event in `MainGameScreen.tsx`. The game timer doesn't start until the image is actually loaded from the server, ensuring a fair experience regardless of internet speed.

---

## 🆔 Topic 4: Virtual Identity (8:00 - 9:30)
### Focus: Security, Persistence & Session Management

**Talking Points:**
*   Establishing a secure, persistent identity for each player.
*   Protecting user data with HttpOnly cookies and JWTs.

#### Behind the Scenes:
Identity isn't just a name; it's a secure session. We use `HttpOnly` cookies so that the user's JWT (token) cannot be stolen by malicious browser scripts (XSS protection).

```python
# backend/app/routers/auth.py
# ASSESSMENT: Virtual Identity — JWT stored in HttpOnly cookie.
response.set_cookie(
    key="session_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="none",
)
```

The `User` model in the database is the "Source of Truth" for this identity, tracking everything from their current capital to their win streaks.

```python
# backend/app/models.py
class User(Base): # ASSESSMENT: Virtual Identity
    name = Column(String, unique=True, index=True)
    capital = Column(Float, default=1000.0)
    avatar_url = Column(String)
```

**Script Tip:** Mention the "Identity Recovery" flow in `LoginScreen.tsx`. If a user loses their credentials, the security question system allows them to reclaim their virtual empire.

---

## 👋 Conclusion (9:30 - 10:00)

**Host:** "By combining strong design principles, seamless interoperability, reactive event handling, and secure identity management, we've built more than just a game—we've built a robust, scalable platform. Thanks for watching this architectural breakdown of Moon Mafia!"
