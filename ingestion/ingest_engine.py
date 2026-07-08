"""Ingestion orchestrator — reads sample inputs, processes via backend, writes dashboard_feed.json."""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app import generate_official_sanction_note, process_grievance

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_inputs"
OUTPUT_PATH = ROOT / "shared" / "dashboard_feed.json"
FRONTEND_OUTPUT = ROOT / "frontend" / "public" / "dashboard_feed.json"

CATEGORY_PROJECT_NAMES = {
    "Water & Sanitation": "Community Drinking Water Plant",
    "Roads & Connectivity": "Rural Road Resurfacing (PMGSY Link)",
    "Health": "Primary Health Sub-Centre Upgrade",
    "Education": "Primary School Bus Shelter & Boundary Wall",
}

HEATMAP_COORDS = {
    "Anandapuram": (17.6868, 83.2185),
    "Gajuwaka": (17.7042, 83.2247),
    "Block A": (17.6721, 83.1954),
    "Kothuru": (17.6612, 83.2411),
    "Ward 4": (17.6868, 83.2185),
    "Ward 6": (17.6988, 83.2089),
    "Ward 2": (17.6721, 83.1954),
}


def severity_label(score: int) -> str:
    if score >= 5:
        return "high"
    if score >= 3:
        return "medium"
    return "low"


def build_project_name(category: str, location: str) -> str:
    base = CATEGORY_PROJECT_NAMES.get(category, "Constituency Development Project")
    if category == "Water & Sanitation" and "canal" in location.lower():
        return "Irrigation Canal Desilting Project"
    return base


def ingest_all():
    input_files = sorted(SAMPLE_DIR.glob("input_*.txt"))
    processed = []

    print(f"Processing {len(input_files)} input files...")

    for filepath in input_files:
        text = filepath.read_text(encoding="utf-8")
        result = process_grievance(text)
        result["source_file"] = filepath.name
        processed.append(result)
        print(f"  [OK] {filepath.name} -> {result['category']} @ {result['location']} (score: {result['infrastructure_gap_score']})")

    processed.sort(key=lambda x: x["infrastructure_gap_score"], reverse=True)

    projects = []
    heatmap_points = []
    seen_locations = set()

    for rank, item in enumerate(processed, start=1):
        location = item["location"]
        project_name = build_project_name(item["category"], item.get("summary", ""))

        project = {
            "id": rank,
            "rank": rank,
            "project_name": project_name,
            "location": f"{location} / Ward {rank}",
            "public_demand_index": item["public_demand_index"],
            "infrastructure_gap_score": int(item["infrastructure_gap_score"]),
            "category": item["category"],
            "severity_score": item["severity_score"],
            "summary": item["summary"],
        }
        project["sanction_note_draft"] = generate_official_sanction_note(project)
        projects.append(project)

        if location not in seen_locations:
            seen_locations.add(location)
            lat, lng = HEATMAP_COORDS.get(location, (17.6868, 83.2185))
            heatmap_points.append({
                "lat": lat,
                "lng": lng,
                "severity": severity_label(item["severity_score"]),
                "label": location,
            })

    ist = timezone(timedelta(hours=5, minutes=30))
    feed = {
        "metrics": {
            "total_grievances": 1482,
            "ai_prioritized_projects": len(projects),
            "active_mplads_fund_crores": 5.0,
            "allocated_funds_crores": 1.45,
        },
        "projects": projects,
        "heatmap_points": heatmap_points,
        "last_updated": datetime.now(ist).isoformat(),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(feed, f, indent=2, ensure_ascii=False)

    with open(FRONTEND_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(feed, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Dashboard feed written to:")
    print(f"  {OUTPUT_PATH}")
    print(f"  {FRONTEND_OUTPUT}")
    return feed


if __name__ == "__main__":
    ingest_all()
