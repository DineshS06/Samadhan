"""Load India-wide geo dataset (DataMeet parliamentary constituencies index)."""

import json
import re
from functools import lru_cache
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GEO_DIR = ROOT_DIR / "shared" / "geo"
ADMIN_INDEX = GEO_DIR / "india_admin.json"
PC_GEOJSON = GEO_DIR / "india_pc_2019_simplified.geojson"


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


@lru_cache(maxsize=1)
def _load_index() -> dict:
    if not ADMIN_INDEX.exists():
        return {"states": {}, "constituencies": []}
    with open(ADMIN_INDEX, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _load_pc_features() -> dict:
    """Map normalized constituency name -> GeoJSON feature."""
    if not PC_GEOJSON.exists():
        return {}
    with open(PC_GEOJSON, encoding="utf-8") as f:
        data = json.load(f)
    out = {}
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        name = props.get("pc_name", "")
        st = props.get("st_name", "")
        key = (_normalize(name), _normalize(st))
        out[key] = feat
        out[_normalize(name)] = feat
    return out


def get_constituency_meta(name: str, state: str | None = None) -> dict | None:
    target = _normalize(name)
    for c in _load_index().get("constituencies", []):
        if _normalize(c["name"]) == target:
            if state is None or _normalize(c["state"]) == _normalize(state):
                return c
    return None


def get_state_meta(state: str) -> dict | None:
    return _load_index().get("states", {}).get(state)


def get_constituency_boundary(name: str, state: str | None = None) -> dict | None:
    feat = _load_pc_features().get((_normalize(name), _normalize(state or "")))
    if not feat:
        feat = _load_pc_features().get(_normalize(name))
    if not feat:
        return None
    return {"type": "FeatureCollection", "features": [feat]}


def resolve_district_coords(district: str, state: str) -> tuple[float, float] | None:
    """Fallback: use constituency centroid when district matches name in same state."""
    meta = get_constituency_meta(district, state)
    if meta:
        return meta["lat"], meta["lng"]
    st = get_state_meta(state)
    if st:
        return st["lat"], st["lng"]
    return None


def list_states() -> list[str]:
    return sorted(_load_index().get("states", {}).keys())


def list_constituencies(state: str | None = None) -> list[str]:
    if state:
        st = get_state_meta(state)
        return st.get("constituencies", []) if st else []
    return [c["name"] for c in _load_index().get("constituencies", [])]
