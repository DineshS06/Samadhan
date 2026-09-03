"""Constituency map configuration using India-wide geo dataset."""

import os
from functools import lru_cache

from india_geo import get_constituency_meta, get_state_meta, resolve_district_coords

MP_CONSTITUENCY = os.environ.get("MP_CONSTITUENCY", "Visakhapatnam")
MP_STATE = os.environ.get("MP_STATE", "Andhra Pradesh")

# Project demo localities (Visakhapatnam reference area)
LOCALITY_COORDS = {
    "Anandapuram": {"lat": 17.6868, "lng": 83.2185, "constituency": "Visakhapatnam"},
    "Gajuwaka": {"lat": 17.7042, "lng": 83.2247, "constituency": "Visakhapatnam"},
    "Block A": {"lat": 17.6721, "lng": 83.1954, "constituency": "Visakhapatnam"},
    "Kothuru": {"lat": 17.6612, "lng": 83.2411, "constituency": "Visakhapatnam"},
    "Ward 2": {"lat": 17.6721, "lng": 83.1954, "constituency": "Visakhapatnam"},
    "Ward 4": {"lat": 17.6868, "lng": 83.2185, "constituency": "Visakhapatnam"},
    "Ward 6": {"lat": 17.6988, "lng": 83.2089, "constituency": "Visakhapatnam"},
}


def severity_label(score: int | float) -> str:
    from app import _safe_int
    score = _safe_int(score, 3)
    if score >= 5:
        return "high"
    if score >= 3:
        return "medium"
    return "low"


def _normalize_name(value: str) -> str:
    return (value or "").strip().lower()


def matches_constituency(entry: dict, constituency: str | None = None) -> bool:
    target = _normalize_name(constituency or MP_CONSTITUENCY)
    if not target:
        return True

    if _normalize_name(entry.get("constituency")) == target:
        return True

    location = _normalize_name(entry.get("location", ""))
    if target in location:
        return True

    keyword = entry.get("location_keyword") or ""
    for name, meta in LOCALITY_COORDS.items():
        if _normalize_name(name) in _normalize_name(keyword) or _normalize_name(keyword) in _normalize_name(name):
            if _normalize_name(meta.get("constituency")) == target:
                return True

    for name, meta in LOCALITY_COORDS.items():
        if _normalize_name(name) in location and _normalize_name(meta.get("constituency")) == target:
            return True

    return False


def resolve_coordinates(entry: dict) -> tuple[float, float, str] | None:
    geo = entry.get("geolocation")
    if geo and geo.get("latitude") is not None and geo.get("longitude") is not None:
        return float(geo["latitude"]), float(geo["longitude"]), "citizen_gps"

    keyword = entry.get("location_keyword") or entry.get("village") or ""
    for name, meta in LOCALITY_COORDS.items():
        if _normalize_name(name) in _normalize_name(keyword) or _normalize_name(keyword) in _normalize_name(name):
            return meta["lat"], meta["lng"], "locality_lookup"

    location = entry.get("location") or ""
    for name, meta in LOCALITY_COORDS.items():
        if name.lower() in location.lower():
            return meta["lat"], meta["lng"], "locality_lookup"

    district = entry.get("district", "")
    state = entry.get("state", "")
    if district and state:
        coords = resolve_district_coords(district, state)
        if coords:
            return coords[0], coords[1], "district_lookup"

    constituency = entry.get("constituency", "")
    if constituency:
        meta = get_constituency_meta(constituency, state or None)
        if meta:
            return meta["lat"], meta["lng"], "constituency_centroid"

    return None


def get_map_config(constituency: str | None = None, state: str | None = None) -> dict:
    name = constituency or MP_CONSTITUENCY
    st = state or MP_STATE
    meta = get_constituency_meta(name, st)

    if meta:
        return {
            "constituency": meta["name"],
            "state": meta["state"],
            "center": [meta["lat"], meta["lng"]],
            "zoom": 11,
            "bounds": meta["bounds"],
            "boundary_url": f"/api/geo/constituency/{meta['slug']}",
            "data_source": "DataMeet India PC 2019",
        }

    return {
        "constituency": name,
        "state": st,
        "center": [20.5937, 78.9629],
        "zoom": 5,
        "bounds": [[8.0, 68.0], [37.0, 97.0]],
        "boundary_url": f"/api/geo/constituency/by-name/{name}",
        "data_source": "India admin fallback",
    }


def build_heatmap_point(entry: dict) -> dict | None:
    coords = resolve_coordinates(entry)
    if not coords:
        return None

    lat, lng, source = coords
    ref = entry.get("reference_id") or f"G-{entry.get('id', 0)}"
    label = entry.get("location_keyword") or ref

    return {
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "severity": severity_label(entry.get("severity_score", 3)),
        "label": label,
        "reference_id": ref,
        "category": entry.get("category", "Other"),
        "summary": entry.get("summary", ""),
        "severity_score": entry.get("severity_score", 3),
        "source": source,
        "has_attachment": entry.get("has_attachment", False),
    }
