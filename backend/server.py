"""Flask API server for Samadhan backend."""

import json
import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response, send_from_directory, abort
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
sys.path.insert(0, str(BASE_DIR))

# Load secrets from backend/.env only
load_dotenv(BASE_DIR / ".env")

from config import get_gemini_status, GEMINI_MODEL
from constants import ALL_LANGUAGES, CATEGORIES, INDIAN_STATES, SEVERITY_LABELS
from geo_constants import (
    MP_CONSTITUENCY,
    build_heatmap_point,
    get_map_config,
    matches_constituency,
)
from india_geo import get_constituency_boundary, get_constituency_meta, list_states
from mp_auth import extract_token, get_session, login, logout
from app import (
    generate_official_sanction_note,
    parse_citizen_grievance,
    process_grievance_submission,
    lookup_location_data,
    calculate_priority_score,
    _mock_sanction_note,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)
logger = logging.getLogger("samadhan.server")

app = Flask(__name__)
CORS(app)

FEED_PATH = ROOT_DIR / "shared" / "dashboard_feed.json"
GRIEVANCES_PATH = ROOT_DIR / "shared" / "grievances_log.json"
PRIVATE_PATH = ROOT_DIR / "shared" / "private_contacts.json"
UPLOADS_PATH = ROOT_DIR / "shared" / "uploads"
GEO_PATH = ROOT_DIR / "shared" / "geo"
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

PII_KEYS = ("citizen_name", "name", "phone", "phone_number", "attachment")
_sanction_cache: dict[int, dict] = {}


def _require_mp_session():
    session = get_session(extract_token(request))
    if not session:
        return None, (jsonify({"error": "MP login required", "login_url": "/mp/login"}), 401)
    return session, None


def _format_sanction(project: dict, use_ai: bool = False) -> dict:
    note = project.get("sanction_note_draft") or _mock_sanction_note(project)
    if use_ai:
        try:
            note = generate_official_sanction_note(project)
        except Exception:
            pass

    return {
        "project_id": project.get("id"),
        "subject": f"Recommendation for {project.get('project_name', 'Project')} at {project.get('location', 'Constituency')}",
        "from_office": "Hon'ble Member of Parliament",
        "to_office": "The District Collector",
        "project_name": project.get("project_name"),
        "location": project.get("location"),
        "category": project.get("category"),
        "summary": project.get("summary", ""),
        "project_scope": (
            f"{project.get('summary', '')} This {project.get('category', 'development')} project addresses "
            "AI-prioritized citizen grievances corroborated with open government data indicators."
        ),
        "budget_allocation": (
            "Funds to be allocated from MPLADS corpus based on district engineering estimates and DPR review."
        ),
        "guidelines": [
            "Concerned district department shall execute within stipulated timeline.",
            "Monthly progress reports to MP Office mandatory.",
            "Quality audit before final payment release.",
            "Citizen feedback via Gram Sabha / Ward Sabha upon completion.",
        ],
        "sanction_note": note,
    }


def _load_grievances() -> list:
    if not GRIEVANCES_PATH.exists():
        return []
    with open(GRIEVANCES_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save_grievances(items: list):
    GRIEVANCES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(GRIEVANCES_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)


def _validate_submission(data: dict) -> str | None:
    if not data.get("name", "").strip():
        return "Full name is required for verification."
    phone = (data.get("phone") or "").replace(" ", "")
    if not phone:
        return "Mobile number is required for follow-up."
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) < 10:
        return "Enter a valid 10-digit mobile number."
    if not data.get("state"):
        return "Please select your state."
    if not data.get("district", "").strip():
        return "District is required to route your grievance."
    if not data.get("constituency", "").strip():
        return "Parliamentary constituency is required."
    if not data.get("language"):
        return "Please select your language."
    if not data.get("category"):
        return "Please select a grievance category."
    if not data.get("text", "").strip():
        return "Please describe your grievance."
    has_village = bool(data.get("village", "").strip())
    has_geo = bool(data.get("geolocation"))
    if not has_village and not has_geo:
        return "Please enter village/town or use GPS location."
    return None


def _save_private_contact(entry_id: int, data: dict):
    PRIVATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    private = []
    if PRIVATE_PATH.exists():
        with open(PRIVATE_PATH, encoding="utf-8") as f:
            private = json.load(f)
    private.insert(0, {
        "id": entry_id,
        "name": data.get("name", "").strip(),
        "phone": data.get("phone", "").strip(),
        "submitted_at": datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(),
    })
    with open(PRIVATE_PATH, "w", encoding="utf-8") as f:
        json.dump(private[:200], f, indent=2, ensure_ascii=False)


def _save_attachment(entry_id: int, attachment: dict) -> str | None:
    if not attachment or not attachment.get("data"):
        return None
    UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
    import base64
    name = attachment.get("name", "evidence.bin").replace("..", "").replace("/", "_")
    safe_name = f"SAM-{entry_id:04d}_{name}"
    filepath = UPLOADS_PATH / safe_name
    try:
        filepath.write_bytes(base64.b64decode(attachment["data"]))
        return safe_name
    except Exception:
        logger.warning("Failed to save attachment for entry %s", entry_id)
        return None


def _redact_entry(entry: dict) -> dict:
    return {k: v for k, v in entry.items() if k not in PII_KEYS and k != "open_data"}


def _build_dashboard_feed(constituency: str | None = None, state: str | None = None) -> dict:
    """Merge static demo feed with live citizen submissions — scoped to MP constituency."""
    if not FEED_PATH.exists():
        return {"error": "Dashboard feed not found"}

    with open(FEED_PATH, encoding="utf-8") as f:
        feed = json.load(f)

    constituency = constituency or MP_CONSTITUENCY
    grievances = [g for g in _load_grievances() if matches_constituency(g, constituency)]
    base_count = feed.get("metrics", {}).get("total_grievances", 0)
    feed["metrics"]["total_grievances"] = base_count + len(grievances)

    live_projects = []
    for g in grievances[:10]:
        score = g.get("infrastructure_gap_score") or g.get("public_demand_index") or 50
        ref = g.get("reference_id") or f"G-{g.get('id', 0)}"
        live_projects.append({
            "id": 1000 + g.get("id", 0),
            "rank": 0,
            "project_name": f"{g.get('category', 'Grievance')} — {ref}",
            "location": g.get("location") or g.get("district") or constituency,
            "public_demand_index": min(100, int(g.get("public_demand_index") or score)),
            "infrastructure_gap_score": round(float(score), 1),
            "category": g.get("category", "Other"),
            "severity_score": g.get("severity_score", 3),
            "summary": g.get("summary", "Citizen grievance pending review"),
            "reference_id": g.get("reference_id"),
            "has_attachment": g.get("has_attachment", False),
            "live_submission": True,
        })

    static_projects = [
        p for p in feed.get("projects", [])
        if matches_constituency({"location": p.get("location", ""), "constituency": constituency}, constituency)
    ]

    merged = live_projects + static_projects
    merged.sort(
        key=lambda p: (p.get("infrastructure_gap_score", 0), p.get("public_demand_index", 0)),
        reverse=True,
    )
    for idx, project in enumerate(merged[:15], start=1):
        project["rank"] = idx

    feed["projects"] = merged[:15]

    # Build heatmap: live citizen pins (GPS or locality) + static demo points
    heatmap_points = []
    by_location = {}

    for g in grievances:
        point = build_heatmap_point(g)
        if not point:
            continue
        loc_key = (round(point["lat"], 4), round(point["lng"], 4))
        existing = by_location.get(loc_key)
        if existing:
            existing["issue_count"] = existing.get("issue_count", 1) + 1
            if point.get("severity_score", 0) > existing.get("severity_score", 0):
                existing.update({k: v for k, v in point.items() if k != "issue_count"})
            refs = existing.get("reference_ids") or [existing.get("reference_id")]
            if point.get("reference_id") and point["reference_id"] not in refs:
                refs.append(point["reference_id"])
            existing["reference_ids"] = refs
            existing["label"] = f"{existing['label']} ({existing['issue_count']} issues)"
        else:
            point["issue_count"] = 1
            point["reference_ids"] = [point["reference_id"]] if point.get("reference_id") else []
            by_location[loc_key] = point

    heatmap_points.extend(by_location.values())

    for p in feed.get("heatmap_points", []):
        loc_key = (round(p["lat"], 4), round(p["lng"], 4))
        if loc_key in by_location:
            continue
        heatmap_points.append({
            **p,
            "source": "aggregated_locality",
            "reference_id": p.get("reference_id"),
            "category": p.get("category", "Infrastructure"),
            "severity_score": {"high": 5, "medium": 3, "low": 1}.get(p.get("severity", "medium"), 3),
            "issue_count": 1,
        })

    feed["heatmap_points"] = heatmap_points
    feed["map"] = get_map_config(constituency, state)
    feed["mp_office"] = {"constituency": constituency, "state": feed["map"]["state"]}
    feed["last_updated"] = datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat()
    return feed


@app.route("/api/info", methods=["GET"])
def api_info():
    """JSON API metadata for developers — not the main website."""
    ai = get_gemini_status(public=True)
    return jsonify({
        "service": "Samadhan Backend API",
        "status": "running",
        "http_status": 200,
        "message": "OK — open http://127.0.0.1:5000/ in browser for the full app",
        "ai": ai,
        "endpoints": {
            "GET /api/health": "Health check",
            "GET /api/config": "Form options for citizen portal",
            "POST /api/submit": "Citizen grievance submission",
            "POST /api/prioritize": "Parse + score grievance",
            "GET /api/grievances": "Submitted grievances log",
            "GET /api/dashboard": "MP dashboard JSON feed",
        },
        "website": {
            "citizen_portal": "http://127.0.0.1:5000/",
            "mp_dashboard": "http://127.0.0.1:5000/mp",
        },
    })


@app.route("/api/health", methods=["GET"])
def health():
    ai = get_gemini_status(public=True)
    return jsonify({
        "status": "ok",
        "http_status": 200,
        "message": "OK — backend is healthy",
        "service": "samadhan-backend",
        "gemini_ready": ai["ready"],
        "gemini_model": ai["model"],
        "mode": ai["mode"],
    })


@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "languages": ALL_LANGUAGES,
        "categories": CATEGORIES,
        "states": INDIAN_STATES,
        "severity_labels": SEVERITY_LABELS,
    })


@app.route("/api/prioritize", methods=["POST"])
def prioritize():
    data = request.get_json(silent=True) or {}
    if not data.get("text", ""):
        return jsonify({"error": "Missing 'text' field"}), 400

    result = process_grievance_submission(data)
    result["channel"] = data.get("channel", "web")
    return jsonify(result)


@app.route("/api/submit", methods=["POST"])
def submit_grievance():
    data = request.get_json(silent=True) or {}
    error = _validate_submission(data)
    if error:
        return jsonify({"error": error}), 400

    result = process_grievance_submission(data)
    result["channel"] = data.get("channel", "web")
    result["constituency"] = data.get("constituency", "")
    result["district"] = data.get("district", "")

    ist = timezone(timedelta(hours=5, minutes=30))
    entry_id = len(_load_grievances()) + 1
    attachment_name = _save_attachment(entry_id, data.get("attachment"))
    _save_private_contact(entry_id, data)

    public_entry = {
        "id": entry_id,
        "submitted_at": datetime.now(ist).isoformat(),
        "reference_id": f"SAM-{entry_id:04d}",
        "has_attachment": bool(attachment_name),
        "attachment_file": attachment_name,
        **_redact_entry(result),
    }
    grievances = _load_grievances()
    grievances.insert(0, public_entry)
    _save_grievances(grievances[:100])

    citizen_result = _redact_entry(result)

    return jsonify({
        "success": True,
        "message": "Your grievance has been registered and sent for AI prioritization.",
        "reference_id": f"SAM-{entry_id:04d}",
        "result": citizen_result,
    })


@app.route("/api/mp/login", methods=["POST"])
def mp_login():
    data = request.get_json(silent=True) or {}
    result = login(data.get("username", ""), data.get("password", ""))
    if not result:
        return jsonify({"error": "Invalid MP credentials"}), 401
    return jsonify({"success": True, **result})


@app.route("/api/mp/logout", methods=["POST"])
def mp_logout():
    logout(extract_token(request) or "")
    return jsonify({"success": True})


@app.route("/api/mp/me", methods=["GET"])
def mp_me():
    session, err = _require_mp_session()
    if err:
        return err
    return jsonify({"mp": {
        "username": session["username"],
        "name": session["name"],
        "constituency": session["constituency"],
        "state": session["state"],
    }})


@app.route("/api/geo/states", methods=["GET"])
def geo_states():
    return jsonify({"states": list_states(), "source": "DataMeet India PC 2019"})


@app.route("/api/geo/constituency/by-name/<name>", methods=["GET"])
def geo_constituency_by_name(name: str):
    state = request.args.get("state")
    boundary = get_constituency_boundary(name, state)
    if not boundary:
        return jsonify({"error": "Constituency not found"}), 404
    return jsonify(boundary)


@app.route("/api/geo/constituency/<slug>", methods=["GET"])
def geo_constituency_by_slug(slug: str):
    from india_geo import _load_index
    meta = next(
        (c for c in _load_index().get("constituencies", []) if c.get("slug") == slug),
        None,
    )
    if not meta:
        return jsonify({"error": "Constituency not found"}), 404
    boundary = get_constituency_boundary(meta["name"], meta["state"])
    if not boundary:
        return jsonify({"error": "Boundary not found"}), 404
    return jsonify(boundary)


@app.route("/api/grievances", methods=["GET"])
def list_grievances():
    """MP-facing list — citizen name/phone never exposed; constituency-scoped."""
    session, err = _require_mp_session()
    if err:
        return err
    items = [
        _redact_entry(g) for g in _load_grievances()
        if matches_constituency(g, session["constituency"])
    ]
    return jsonify(items)


@app.route("/geo/<path:filename>")
def serve_geo(filename):
    if not GEO_PATH.exists():
        abort(404)
    return send_from_directory(GEO_PATH, filename)


@app.route("/api/parse", methods=["POST"])
def parse_only():
    data = request.get_json(silent=True) or {}
    if not data.get("text", ""):
        return jsonify({"error": "Missing 'text' field"}), 400

    ai_data = parse_citizen_grievance(data["text"], data)
    loc = data.get("village") or ai_data.get("location_keyword", "")
    db_data = lookup_location_data(loc, data.get("district", ""), data.get("state", ""))
    score = calculate_priority_score(ai_data, db_data)

    return jsonify({"ai_data": ai_data, "db_data": db_data, "priority_score": score})


@app.route("/api/grievance/<reference_id>", methods=["GET"])
def get_grievance_by_reference(reference_id: str):
    """Get a grievance by its reference ID (e.g., SAM-0001) - citizen-accessible."""
    # Validate reference_id format (SAM-XXXX where X is digit)
    import re
    if not re.match(r'^SAM-\d{4}$', reference_id):
        return jsonify({"error": "Invalid reference ID format"}), 400

    # Load all grievances
    grievances = _load_grievances()

    # Find the grievance with matching reference_id
    matching_grievances = [g for g in grievances if g.get("reference_id") == reference_id]

    if not matching_grievances:
        return jsonify({"error": "Grievance not found"}), 404

    # Return the redacted version (same as what's shown to citizens upon submission)
    grievance = matching_grievances[0]  # Take the first match (should be only one)
    redacted_grievance = _redact_entry(grievance)

    return jsonify({
        "success": True,
        "reference_id": reference_id,
        "result": redacted_grievance
    })


def _find_project(project_id: int, constituency: str | None = None, state: str | None = None) -> dict | None:
    feed = _build_dashboard_feed(constituency, state)
    return next((p for p in feed.get("projects", []) if p.get("id") == project_id), None)


@app.route("/api/sanction/<int:project_id>", methods=["GET"])
def get_sanction(project_id: int):
    session, err = _require_mp_session()
    if err:
        return err

    if project_id in _sanction_cache:
        return jsonify(_sanction_cache[project_id])

    project = _find_project(project_id, session["constituency"], session["state"])
    if not project and FEED_PATH.exists():
        with open(FEED_PATH, encoding="utf-8") as f:
            feed = json.load(f)
        project = next((p for p in feed.get("projects", []) if p.get("id") == project_id), None)

    if not project:
        return jsonify({"error": "Project not found"}), 404

    use_ai = request.args.get("ai") == "1"
    payload = _format_sanction(project, use_ai=use_ai)
    _sanction_cache[project_id] = payload
    return jsonify(payload)


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    session, err = _require_mp_session()
    if err:
        return err
    feed = _build_dashboard_feed(session["constituency"], session["state"])
    if feed.get("error"):
        return jsonify(feed), 404
    feed["mp_office"]["name"] = session["name"]
    feed["mp_office"]["username"] = session["username"]
    return jsonify(feed)


# ── Serve React frontend from port 5000 (single URL for demo) ──

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    if not FRONTEND_DIST.exists():
        abort(404, "Frontend not built. Run: cd frontend && npm run build")
    return send_from_directory(FRONTEND_DIST / "assets", filename)


@app.route("/dashboard_feed.json")
def serve_dashboard_feed():
    if not FRONTEND_DIST.exists():
        abort(404)
    return send_from_directory(FRONTEND_DIST, "dashboard_feed.json")


@app.route("/favicon.svg")
def serve_favicon():
    if FRONTEND_DIST.exists():
        return send_from_directory(FRONTEND_DIST, "favicon.svg")
    abort(404)


@app.route("/")
@app.route("/mp")
@app.route("/mp/login")
def serve_app():
    """Citizen portal (/) and MP dashboard (/mp) — the actual website."""
    if not FRONTEND_DIST.exists():
        ai = get_gemini_status(public=True)
        html = f"""<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;color:#032B5B">
        <h1>Frontend not built yet</h1>
        <p>Run: <code>cd frontend && npm install && npm run build</code></p>
        <p>API is running. Gemini: {'Active' if ai['ready'] else 'Offline'}</p>
        <a href="/api/health">/api/health</a></body></html>"""
        return Response(html, mimetype="text/html")
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    ai = get_gemini_status(public=True)
    if ai["ready"]:
        logger.info("Samadhan backend started — Gemini %s active", ai["model"])
    else:
        logger.info("Samadhan backend started — offline parser (add key to backend/.env for live AI)")
    logger.info("Website:  http://127.0.0.1:5000/       (Citizen Portal)")
    logger.info("          http://127.0.0.1:5000/mp     (MP Dashboard)")
    logger.info("API info: http://127.0.0.1:5000/api/health")

    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug)
