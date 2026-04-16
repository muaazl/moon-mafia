# ASSESSMENT: "Interoperability - This module isolates all external API connections so our system can communicate easily with third-party services."
import httpx
import random

HEART_API_URL = "http://marcconrad.com/uob/heart/api.php?out=json"
NO_API_URL = "https://naas.isalman.dev/no"
DIFFICULTY_SECONDS = {
    "easy": 5,
    "medium": 2,
    "hard": 1,
}


http_client: httpx.AsyncClient = None

def init_http_client():
    global http_client
    http_client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)


async def fetch_heart_image() -> dict:
    """
    Calls the external Heart API and returns image URL, heart count, and carrot count.
    """
    response = await http_client.get(HEART_API_URL)
    response.raise_for_status()

    data = response.json()
    return {
        "image_url": data.get("question", ""),
        "solution": int(data.get("solution", 0)),
        "carrots": int(data.get("carrots", 0)),
    }


async def fetch_no_reason() -> str:
    """Fetches a snarky 'No' reason from naas.isalman.dev/no."""
    try:
        response = await http_client.get(NO_API_URL, timeout=5.0)
        response.raise_for_status()
        return response.json().get("reason", "No reason given. Just... no.")
    except Exception:
        return "No reason given. Just... no."
