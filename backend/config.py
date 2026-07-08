"""Environment and Gemini client — uses google.genai SDK."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger("samadhan.config")

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

_api_key = (
    os.environ.get("GOOGLE_AI_STUDIO_KEY")
    or os.environ.get("GEMINI_API_KEY")
    or os.environ.get("GOOGLE_API_KEY")
    or ""
).strip().strip('"').strip("'")

# gemini-1.5-flash is retired for many keys — try flash family in order
MODELS_TO_TRY = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
]

GEMINI_MODEL = "gemini-2.0-flash"

_client = None
_gemini_ready = False
_init_attempted = False


def _init_gemini() -> bool:
    global _client, _gemini_ready, _init_attempted, GEMINI_MODEL

    if _init_attempted:
        return _gemini_ready
    _init_attempted = True

    if not _api_key or _api_key == "your_api_key_here":
        logger.info("No API key in backend/.env — offline parser active")
        return False

    try:
        from google import genai

        client = genai.Client(api_key=_api_key)

        for model_name in MODELS_TO_TRY:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents="Reply with exactly: ok",
                )
                if response and response.text:
                    _client = client
                    GEMINI_MODEL = model_name
                    _gemini_ready = True
                    logger.info("Gemini connected: %s", model_name)
                    return True
            except Exception:
                continue

        logger.error("Gemini: no working flash model found for this API key")
        return False
    except Exception:
        logger.error("Gemini initialization failed")
        return False


def generate_content(prompt: str, json_mode: bool = False) -> str:
    if not _init_gemini() or _client is None:
        raise RuntimeError("Gemini not available")

    from google.genai import types

    config = types.GenerateContentConfig(response_mime_type="application/json") if json_mode else None

    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=config,
    )

    text = response.text
    if not text and getattr(response, "candidates", None):
        parts = response.candidates[0].content.parts
        if parts:
            text = getattr(parts[0], "text", None)

    if not text:
        raise RuntimeError("Empty response from Gemini")

    return text.strip()


def get_gemini_status(public: bool = False) -> dict:
    _init_gemini()
    configured = bool(_api_key and _api_key not in ("your_api_key_here", ""))

    if public:
        if _gemini_ready:
            return {"ready": True, "model": GEMINI_MODEL, "mode": "live"}
        if configured:
            return {"ready": False, "model": None, "mode": "connection_failed"}
        return {"ready": False, "model": None, "mode": "offline"}

    return {"ready": _gemini_ready, "model": GEMINI_MODEL if _gemini_ready else None, "configured": configured}
