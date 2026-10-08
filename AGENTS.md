# AGENTS.md

Civic-tech hackathon app (Samadhan): React/Vite frontend + Flask/Gemini backend. No CI, no test runner, no linter configured.

## Commands

Frontend (only Node project; all commands run from `frontend/`):

- `npm run dev` — Vite on :5173, proxies `/api` to `http://127.0.0.1:5000`
- `npm run build` — required before the Flask server can serve the site
- `npm run audit` — syntax + SEO audit; this is the closest thing to a test suite
- `node scripts/comprehensive-seo-audit.mjs` — the largest audit, but it is NOT wired to an npm script
- `npm run validate:schema` is documented in `frontend/CLAUDE.md` but does not exist in `package.json`. Run `node scripts/validate-schema.mjs` instead.

Backend (Python, no venv checked in):

- `pip install -r backend/requirements.txt`
- `python backend/server.py` — Flask on :5000, serves both the API and `frontend/dist`
- `python ingestion/ingest_engine.py` — regenerates `shared/dashboard_feed.json` and `frontend/public/dashboard_feed.json` from `ingestion/sample_inputs/`

There is no unit test suite. Verify changes with `npm run audit` plus a manual load of the affected page.

## Architecture notes

- **Two ways to run the frontend.** Vite dev server (:5173) with the `/api` proxy, OR `npm run build` then hit Flask (:5000), which serves `frontend/dist` for `/`, `/mp`, `/mp/login`, `/assets/*`, `/dashboard_feed.json`, `/favicon.svg`. Without a build, `/` returns a "Frontend not built yet" HTML page.
- **Every API call degrades gracefully.** `src/lib/api.js` and `src/lib/mpAuth.js` catch all errors and fall back to mock data / the static `dashboard_feed.json`. A broken backend looks like a working demo, so check the browser console for `falling back to mock` warnings when debugging.
- **Backend imports are path-inserted, not installed.** `backend/server.py` and `ingestion/ingest_engine.py` do `sys.path.insert(0, .../backend)` and import `config`, `app`, `mp_auth` as top-level modules. Run them as scripts from their own paths; importing `backend.app` from elsewhere will not resolve.
- **Gemini falls back silently.** `backend/config.py` tries `MODELS_TO_TRY` in order and falls back to the offline parser if none work. Check `/api/health` for `gemini_ready`. Env var is `GOOGLE_AI_STUDIO_KEY` in `backend/.env` (never committed).
- **State lives in committed JSON.** `shared/grievances_log.json` is written by the API; `shared/private_contacts.json` and `shared/uploads/` are gitignored. Citizen PII is stripped from API responses via `PII_KEYS` in `server.py`.
- **MP auth is demo-only.** Hardcoded accounts in `backend/mp_auth.py` (password `samadhan2026`), in-memory session dict, bearer token in `sessionStorage`. Do not present this as real auth.

## SEO is a hard requirement, not a nice-to-have

This project's grading is SEO-driven. The audits fail on these, so keep them satisfied when touching frontend code:

- Every route in `src/App.jsx` must render `<SEO title=... description=... path=... />` before the page. `scripts/seo-audit.mjs` regex-matches that exact JSX shape (`path='...' element={<><SEO title='...' description='...`), so reformatting those attributes breaks the audit.
- `/mp`, `/mp/login`, and 404 must pass `noIndex`.
- Adding a public route means updating all of: `src/App.jsx`, `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`, and `index.html`. `seo-audit.mjs` fails if a sitemap URL has no matching route.
- Schema.org JSON-LD in `App.jsx` must mirror visible on-page copy (FAQ answers, HowTo steps). Comments in that file call this out explicitly.
- Images must carry an `alt` attribute. There is no image helper component: the only `<img>` in the app is the above-the-fold header logo, which must not be lazy-loaded. If below-the-fold imagery is added, render it with `loading="lazy"` and an `alt`. Exactly one H1 per page.

## Deploy

Two Vercel configs exist and must stay in sync — root `vercel.json` (builds `cd frontend && npm run build`, output `frontend/dist`) and `frontend/vercel.json` (identical rules, relative paths). If you change redirects, security headers, or cleanUrls, change both.

Only the frontend is deployed. There is no hosted backend, so `/api/*` is a dead path on the deployed URL and the app runs on its mock fallbacks.