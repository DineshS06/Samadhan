#!/usr/bin/env python3
"""Generate static .md files for all public routes at build time.

Called by frontend/scripts/prerender.mjs after writing per-route HTML.
Writes dist/<route>.md for each public route (dist/index.md for root).

These static files are what Vercel serves when a crawler requests
/.md suffixes on the deployed frontend-only site (no backend).
"""

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = SCRIPT_DIR.parent
REPO_ROOT = FRONTEND_DIR.parent
BACKEND_DIR = REPO_ROOT / "backend"

sys.path.insert(0, str(BACKEND_DIR))

from md_renderers import MD_RENDERERS  # noqa: E402


def route_file(dist_dir: Path, path: str) -> Path:
    """Return the dist file path for a route's markdown."""
    if path == "" or path == "/":
        return dist_dir / "index.md"
    return dist_dir / (path.lstrip("/") + ".md")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python generate_markdown.py <dist_dir>", file=sys.stderr)
        sys.exit(1)

    dist_dir = Path(sys.argv[1]).resolve()
    if not dist_dir.is_dir():
        print(f"dist directory not found: {dist_dir}", file=sys.stderr)
        sys.exit(1)

    written = []
    for path, renderer in MD_RENDERERS.items():
        content = renderer()
        out_file = route_file(dist_dir, path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(content, encoding="utf-8")
        written.append(path or "/")

    print(f"generate_markdown: wrote {len(written)} .md files")
    for p in written:
        print(f"  {p}")


if __name__ == "__main__":
    main()
