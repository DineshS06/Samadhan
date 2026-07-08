"""MP office authentication — session tokens for constituency-scoped dashboard."""

import hashlib
import os
import secrets
import time
from typing import Any

# Demo MP accounts — replace with secure DB in production
MP_ACCOUNTS = [
    {
        "username": "mp.visakhapatnam",
        "password_hash": hashlib.sha256(b"samadhan2026").hexdigest(),
        "name": "Hon'ble Member of Parliament",
        "constituency": "Visakhapatnam",
        "state": "Andhra Pradesh",
    },
    {
        "username": "mp.hyderabad",
        "password_hash": hashlib.sha256(b"samadhan2026").hexdigest(),
        "name": "Hon'ble Member of Parliament",
        "constituency": "Hyderabad",
        "state": "Telangana",
    },
    {
        "username": "mp.delhi",
        "password_hash": hashlib.sha256(b"samadhan2026").hexdigest(),
        "name": "Hon'ble Member of Parliament",
        "constituency": "New Delhi",
        "state": "Delhi",
    },
    {
        "username": "mp.lucknow",
        "password_hash": hashlib.sha256(b"samadhan2026").hexdigest(),
        "name": "Hon'ble Member of Parliament",
        "constituency": "Lucknow",
        "state": "Uttar Pradesh",
    },
]

SESSION_TTL_SECONDS = int(os.environ.get("MP_SESSION_TTL", "86400"))
_sessions: dict[str, dict[str, Any]] = {}


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def login(username: str, password: str) -> dict | None:
    username = (username or "").strip().lower()
    pwd_hash = _hash_password(password or "")
    account = next(
        (a for a in MP_ACCOUNTS if a["username"].lower() == username and a["password_hash"] == pwd_hash),
        None,
    )
    if not account:
        return None

    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        "username": account["username"],
        "name": account["name"],
        "constituency": account["constituency"],
        "state": account["state"],
        "expires_at": time.time() + SESSION_TTL_SECONDS,
    }
    return {"token": token, "mp": _public_profile(_sessions[token])}


def logout(token: str):
    _sessions.pop(token, None)


def get_session(token: str | None) -> dict | None:
    if not token:
        return None
    session = _sessions.get(token)
    if not session:
        return None
    if session["expires_at"] < time.time():
        _sessions.pop(token, None)
        return None
    return session


def _public_profile(session: dict) -> dict:
    return {
        "username": session["username"],
        "name": session["name"],
        "constituency": session["constituency"],
        "state": session["state"],
    }


def extract_token(request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return request.headers.get("X-MP-Token") or request.cookies.get("mp_token")
