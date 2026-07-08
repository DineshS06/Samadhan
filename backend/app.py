"""Samadhan core AI processing pipeline — Gemini parsing, scoring, sanction notes."""

import json
import logging
import re
from pathlib import Path

from config import generate_content, get_gemini_status
from constants import CATEGORIES

logger = logging.getLogger("samadhan.app")

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DATA_PATH = BASE_DIR / "public_data.json"


def _gemini_is_ready() -> bool:
    return get_gemini_status()["ready"]


def _load_public_data() -> dict:
    with open(PUBLIC_DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def lookup_location_data(location_keyword: str, district: str = "", state: str = "") -> dict:
    """Match location keyword against public dataset keys."""
    db = _load_public_data()
    keyword = (location_keyword or district or "").strip()

    for key, data in db.items():
        if key.lower() in keyword.lower() or keyword.lower() in key.lower():
            return {"matched_location": key, "district": district, "state": state, **data}

    return {
        "matched_location": keyword or district or "Unknown",
        "district": district,
        "state": state,
        "existing_schools": 1,
        "water_scarcity_index": "Medium",
        "population": 5000,
        "population_density_children": 500,
    }


def _build_parse_prompt(payload: dict) -> str:
    language = payload.get("language", "Unknown")
    category_hint = payload.get("category", "")
    location_parts = [
        payload.get("village", ""),
        payload.get("ward_block", ""),
        payload.get("district", ""),
        payload.get("constituency", ""),
        payload.get("state", ""),
        payload.get("pincode", ""),
    ]
    location_context = ", ".join(p for p in location_parts if p)
    geo = payload.get("geolocation")
    geo_text = ""
    if geo and geo.get("latitude") is not None:
        geo_text = f"GPS coordinates: {geo['latitude']}, {geo['longitude']}"

    return f"""
You are Samadhan — India's civic grievance AI engine for MP offices.

The citizen wrote in {language}. You MUST understand ALL Indian languages including:
Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili,
Malayalam, Manipuli, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil,
Telugu, Urdu, Bhojpuri, and any other Indian regional language or dialect.

Citizen-provided metadata:
- Stated category: {category_hint or "Not specified — infer from text"}
- Location context: {location_context or "Not provided — extract from text if possible"}
- {geo_text}

Return ONLY a JSON object:
{{
  "category": one of {json.dumps(CATEGORIES)},
  "summary": "One clear English sentence describing the problem",
  "severity_score": integer 1-5,
  "target_demographic": "Farmers" | "Students" | "Women" | "Elderly" | "General Public",
  "location_keyword": "Primary village/ward/locality name",
  "detected_language": "Language name detected in input"
}}

Citizen grievance text:
{payload.get("text", "")}
"""


def _extract_json(text: str) -> dict:
    """Parse JSON from Gemini output, tolerating markdown fences."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group())
        raise


def parse_citizen_grievance(raw_input_data: str, metadata: dict | None = None) -> dict:
    """Translate and structure citizen grievance via Gemini (with mock fallback)."""
    payload = {"text": raw_input_data, **(metadata or {})}

    if not _gemini_is_ready():
        return _mock_parse(raw_input_data, metadata)

    prompt = _build_parse_prompt(payload)

    for json_mode in (True, False):
        try:
            text = generate_content(prompt, json_mode=json_mode)
            parsed = _extract_json(text)
            if parsed.get("category") not in CATEGORIES:
                parsed["category"] = _normalize_category(parsed.get("category", ""))
            parsed["severity_score"] = min(5, max(1, int(parsed.get("severity_score", 3))))
            return parsed
        except Exception as exc:
            logger.debug("Gemini parse attempt (json_mode=%s) failed: %s", json_mode, exc)

    logger.warning("Gemini parse failed — using offline parser")
    return _mock_parse(raw_input_data, metadata)


def _normalize_category(raw: str) -> str:
    raw_lower = (raw or "").lower()
    mapping = {
        "road": "Roads & Connectivity",
        "water": "Water & Sanitation",
        "health": "Health & Medical",
        "education": "Education & Schools",
        "electric": "Electricity & Power",
        "housing": "Housing & Slums",
        "agri": "Agriculture & Irrigation",
        "employ": "Employment & Livelihood",
        "law": "Law & Order / Safety",
        "environment": "Environment & Pollution",
        "transport": "Public Transport",
    }
    for key, cat in mapping.items():
        if key in raw_lower:
            return cat
    return "Other"


def _mock_parse(raw_input_data: str, metadata: dict | None = None) -> dict:
    """Keyword-based fallback when API key is unavailable."""
    text = raw_input_data.lower()
    meta = metadata or {}

    location = meta.get("village") or meta.get("ward_block") or "Anandapuram"
    for loc in ["anandapuram", "gajuwaka", "kothuru", "block a", "ward 4", "ward 6"]:
        if loc in text:
            location = loc.title()
            break

    category = meta.get("category") or ""
    if category and category != "Other":
        cat = category
    elif any(w in text for w in ["pani", "water", "pipe", "canal", "sinchai", "irrigation", "neeru"]):
        cat = "Water & Sanitation"
    elif any(w in text for w in ["school", "vidyalayam", "padhai", "student", "bus shelter", "patasala"]):
        cat = "Education & Schools"
    elif any(w in text for w in ["health", "hospital", "clinic", "doctor", "ambulance", "phc"]):
        cat = "Health & Medical"
    elif any(w in text for w in ["road", "rasta", "pothole", "sadak", "raasta"]):
        cat = "Roads & Connectivity"
    elif any(w in text for w in ["bijli", "electric", "power", "current"]):
        cat = "Electricity & Power"
    else:
        cat = "Other"

    severity = int(meta.get("self_reported_severity") or 3)

    return {
        "category": cat,
        "summary": f"Citizen reports a {cat.lower()} issue requiring constituency intervention",
        "severity_score": min(5, max(1, severity)),
        "target_demographic": "General Public",
        "location_keyword": location,
        "detected_language": meta.get("language", "Unknown"),
    }


def calculate_priority_score(ai_data: dict, db_data: dict) -> float:
    """Merge AI output with open-data lookup into a weighted priority score."""
    gap_score = 100 if db_data.get("existing_schools", 0) == 0 else 20

    if db_data.get("water_scarcity_index") == "High":
        gap_score = max(gap_score, 80)
    elif db_data.get("water_scarcity_index") == "Medium":
        gap_score = max(gap_score, 50)

    if "Education" in ai_data.get("category", "") and db_data.get("existing_schools", 0) == 0:
        gap_score = 100

    final_score = (ai_data["severity_score"] * 10) + (gap_score * 0.6)
    return round(final_score, 1)


def generate_official_sanction_note(project_details: dict) -> str:
    """Generate formal MPLADS administrative sanction note."""
    prompt = (
        f"Write a highly formal administrative sanction note from a Member of Parliament "
        f"to the District Collector recommending the project using MPLADS funds.\n\n"
        f"Project details: {json.dumps(project_details, ensure_ascii=False)}\n\n"
        f"Include sections for: Project Scope, Estimated Budget Allocation, "
        f"and Department Accountability Guidelines. Use formal Indian government letter format."
    )

    if not _gemini_is_ready():
        return _mock_sanction_note(project_details)

    try:
        return generate_content(prompt)
    except Exception:
        return _mock_sanction_note(project_details)


def _mock_sanction_note(project_details: dict) -> str:
    name = project_details.get("project_name", "Infrastructure Project")
    location = project_details.get("location", "Constituency")
    category = project_details.get("category", "Development")
    summary = project_details.get("summary", "")

    return f"""DRAFT ADMINISTRATIVE SANCTION TO DISTRICT COLLECTOR UNDER MPLADS

From: Hon'ble Member of Parliament
To: The District Collector

Subject: Recommendation for {name} at {location}

Project Scope:
{summary}. This {category} project addresses AI-prioritized citizen grievances corroborated with open government data indicators for the area.

Estimated Budget Allocation:
Funds to be allocated from MPLADS corpus based on district engineering estimates and DPR review.

Department Accountability Guidelines:
1. Concerned district department shall execute within stipulated timeline.
2. Monthly progress reports to MP Office mandatory.
3. Quality audit before final payment release.
4. Citizen feedback via Gram Sabha / Ward Sabha upon completion.

This recommendation is issued under MPLADS guidelines for constituency development."""


def process_grievance_submission(data: dict) -> dict:
    """Full pipeline with structured citizen form data."""
    text = data.get("text", "").strip()
    metadata = {
        "language": data.get("language"),
        "category": data.get("category"),
        "village": data.get("village"),
        "ward_block": data.get("ward_block"),
        "district": data.get("district"),
        "constituency": data.get("constituency"),
        "state": data.get("state"),
        "pincode": data.get("pincode"),
        "geolocation": data.get("geolocation"),
        "self_reported_severity": data.get("self_reported_severity"),
    }

    ai_data = parse_citizen_grievance(text, metadata)

    location_keyword = (
        data.get("village")
        or data.get("ward_block")
        or ai_data.get("location_keyword")
        or ""
    )
    db_data = lookup_location_data(
        location_keyword,
        district=data.get("district", ""),
        state=data.get("state", ""),
    )
    score = calculate_priority_score(ai_data, db_data)

    location_display = ", ".join(
        p for p in [
            data.get("village") or db_data["matched_location"],
            data.get("ward_block"),
            data.get("district"),
            data.get("constituency"),
            data.get("state"),
        ] if p
    )

    return {
        **ai_data,
        "location": location_display,
        "location_keyword": location_keyword or db_data["matched_location"],
        "infrastructure_gap_score": score,
        "public_demand_index": min(100, int(score + ai_data["severity_score"] * 5)),
        "open_data": db_data,
        "geolocation": data.get("geolocation"),
        "language": data.get("language"),
        "citizen_category": data.get("category"),
    }


def process_grievance(raw_text: str) -> dict:
    """Legacy: text-only pipeline."""
    return process_grievance_submission({"text": raw_text})


def run_test_suite():
    """Run multilingual test cases."""
    test_cases = [
        ("Hindi farmer", "Hamare gaon Kothuru mein sinchai canal sil gaya hai.", {"language": "Hindi", "village": "Kothuru"}),
        ("Telugu student", "Anandapuram lo school dooram undi.", {"language": "Telugu", "village": "Anandapuram"}),
        ("English health", "Gajuwaka PHC has no ambulance.", {"language": "English", "village": "Gajuwaka"}),
    ]

    print("=" * 60)
    print("SAMADHAN BACKEND TEST SUITE")
    print("=" * 60)
    print(f"Gemini: {get_gemini_status()}\n")

    for label, text, meta in test_cases:
        result = process_grievance_submission({"text": text, **meta})
        print(f"\n--- {label} ---")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\n" + "=" * 60)


if __name__ == "__main__":
    run_test_suite()
