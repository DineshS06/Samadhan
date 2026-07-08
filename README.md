# Samadhan — Constituency Development Engine

AI-powered civic grievance prioritization and MPLADS sanction dashboard for Member of Parliament offices.

## Architecture

```
samadhan/
├── frontend/          React + Tailwind MP executive dashboard
├── backend/           Gemini AI parser, scorer, Flask API
├── ingestion/         Multi-channel input funnel → dashboard_feed.json
└── shared/            Integration contract (dashboard_feed.json)
```

## Quick Start (Demo Mode — No API Key Required)

### 1. Frontend (Citizen + MP views)

```bash
cd frontend
npm install
npm run dev
```

| URL | Audience |
|-----|----------|
| **http://localhost:5173/** | **Citizens** — submit grievances in any language |
| **http://localhost:5173/mp** | **MP / staff** — priority dashboard & sanction notes |

### 2. Backend API

```bash
cd backend
pip install -r requirements.txt
```

## Security — API Keys

- **Never** commit `backend/.env` (already in `.gitignore`)
- **Never** put real keys in `.env.example` or chat screenshots
- If a key was exposed, **revoke it** at [Google AI Studio](https://aistudio.google.com/apikey) and create a new one
- Health endpoints return only `gemini_ready: true/false` — never key values or prefixes

## Enable Live Gemini AI

1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Edit **`backend/.env`** locally (this file stays on your machine only):
   ```
   GOOGLE_AI_STUDIO_KEY=your_key_here
   ```
3. Restart: `python backend/server.py`
4. Check http://127.0.0.1:5000/api/health — `gemini_ready` should be `true`

```bash
python server.py       # Start Flask API on port 5000
```

Verify:
- http://127.0.0.1:5000/ — API info (JSON, not HTML — this is normal)
- http://127.0.0.1:5000/api/health — should show `gemini_ready: true` if key is set

Restart the server after adding/changing the API key.

### 3. Ingestion Pipeline

```bash
python ingestion/ingest_engine.py
```

Reads `/ingestion/sample_inputs/`, processes via Gemini (or mock fallback), writes:
- `shared/dashboard_feed.json`
- `frontend/public/dashboard_feed.json`

## Live API + Frontend Integration

1. Start backend: `python backend/server.py`
2. Expose via ngrok: `ngrok http 5000`
3. Set frontend env: `VITE_API_URL=https://your-ngrok-url.ngrok-free.app`
4. Restart frontend dev server

## Deploy Frontend (Vercel)

1. Push repo to GitHub
2. Import on [vercel.com](https://vercel.com) — set root to `/frontend`
3. Submit the Vercel URL to judges

## Demo Flow

1. **Citizen side:** Open `/` → submit a grievance in Hindi/Telugu → see AI parse result + reference ID
2. **MP side:** Open `/mp` → show metric ribbon and priority table
3. Click **Review & Sanction** → AI-generated administrative note modal
4. Click **Forward to District Administration**
5. (Optional) Run `python ingestion/ingest_engine.py` to show batch pipeline

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **AI:** Google Gemini 1.5 Flash via `google-generativeai`
- **Backend:** Python, Flask, Flask-CORS
- **Data:** Mock open-government dataset (`public_data.json`)

## Team Roles

| Person | Folder | Responsibility |
|--------|--------|----------------|
| Frontend | `/frontend` | Citizen portal (`/`) + MP dashboard (`/mp`) |
| Backend | `/backend` | Gemini parsing + scoring + Flask API |
| Integration | `/ingestion` | Multi-channel ingestion funnel |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info JSON (not a web page) |
| GET | `/api/health` | Health check + Gemini status |
| POST | `/api/submit` | Citizen grievance submission |
| POST | `/api/prioritize` | Process grievance text → scored result |
| GET | `/api/grievances` | List submitted grievances |
| GET | `/api/sanction/<id>` | Generate sanction note for project |
| GET | `/api/dashboard` | Full dashboard feed JSON |

## License

Hackathon project — Samadhan Civic Tech 2026
