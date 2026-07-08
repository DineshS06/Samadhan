"""Build India administrative geo index from DataMeet parliamentary constituencies GeoJSON."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PC_GEOJSON = ROOT / "shared" / "geo" / "india_pc_2019_simplified.geojson"
OUT_INDEX = ROOT / "shared" / "geo" / "india_admin.json"


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def ring_centroid(ring: list) -> tuple[float, float]:
    if not ring:
        return 0.0, 0.0
    lngs = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    return sum(lats) / len(lats), sum(lngs) / len(lngs)


def geometry_centroid(geom: dict) -> tuple[float, float]:
    gtype = geom.get("type")
    coords = geom.get("coordinates", [])
    if gtype == "Polygon" and coords:
        return ring_centroid(coords[0])
    if gtype == "MultiPolygon" and coords:
        largest = max(coords, key=lambda poly: len(poly[0]) if poly and poly[0] else 0)
        return ring_centroid(largest[0])
    return 20.5937, 78.9629


def bounds_from_geometry(geom: dict) -> list:
    gtype = geom.get("type")
    coords = geom.get("coordinates", [])
    points = []

    def walk(c):
        if isinstance(c[0], (int, float)):
            points.append(c)
        else:
            for item in c:
                walk(item)

    walk(coords)
    lats = [p[1] for p in points]
    lngs = [p[0] for p in points]
    return [[min(lats), min(lngs)], [max(lats), max(lngs)]]


def main():
    if not PC_GEOJSON.exists():
        raise SystemExit(f"Missing {PC_GEOJSON}. Download DataMeet india_pc_2019_simplified.geojson first.")

    data = json.loads(PC_GEOJSON.read_text(encoding="utf-8"))
    states: dict[str, dict] = {}
    constituencies: list[dict] = []

    for feat in data.get("features", []):
        props = feat.get("properties", {})
        pc_name = props.get("pc_name", "").strip()
        st_name = props.get("st_name", "").strip()
        if not pc_name or not st_name:
            continue

        lat, lng = geometry_centroid(feat["geometry"])
        bounds = bounds_from_geometry(feat["geometry"])
        slug = slugify(pc_name)

        entry = {
            "name": pc_name,
            "state": st_name,
            "pc_id": props.get("pc_id"),
            "pc_no": props.get("pc_no"),
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "bounds": bounds,
            "slug": slug,
            "category": props.get("pc_category"),
        }
        constituencies.append(entry)

        st = states.setdefault(st_name, {"name": st_name, "constituencies": [], "lat": 0.0, "lng": 0.0, "count": 0})
        st["constituencies"].append(pc_name)
        st["lat"] += lat
        st["lng"] += lng
        st["count"] += 1

    for st in states.values():
        if st["count"]:
            st["lat"] = round(st["lat"] / st["count"], 6)
            st["lng"] = round(st["lng"] / st["count"], 6)
        st["constituency_count"] = st.pop("count")
        st["constituencies"] = sorted(set(st["constituencies"]))

    index = {
        "source": "DataMeet india_pc_2019_simplified (CC0)",
        "updated": "2019",
        "states": states,
        "constituencies": sorted(constituencies, key=lambda x: (x["state"], x["name"])),
        "total_constituencies": len(constituencies),
    }

    OUT_INDEX.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Built index: {len(constituencies)} constituencies, {len(states)} states")
    print(f"Output: {OUT_INDEX}")


if __name__ == "__main__":
    main()
