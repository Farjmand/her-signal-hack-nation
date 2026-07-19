# Deploying to Railway

This repo is a monorepo with two deployable services: `backend/` (Express API + SQLite)
and `frontend/` (Vite/React static build). Each has its own `railway.json`, so they
must be created as **two separate Railway services** in the same project, each with its
**Root Directory** set to the matching folder.

## 1. Backend service

1. New Service → Deploy from GitHub repo → set **Root Directory** to `backend`.
2. Railway auto-detects `backend/railway.json` (Nixpacks build: `npm ci && npm run build`,
   start: `npm start`, health check: `/health`).
3. Environment variables:
   - `OPENAI_API_KEY` — required, used by `POST /api/extract`.
   - `PORT` — set automatically by Railway; the app already reads `process.env.PORT`.
4. Persistent storage: SQLite is written to `backend/data/hersignal.db`, which is
   ephemeral without a volume. Add a **Volume** to this service mounted at `/app/data`
   so evidence capsules and consent records survive redeploys.
5. Note the generated public domain (Settings → Networking → Generate Domain) — the
   frontend needs it as `VITE_API_URL`.

## 2. Frontend service

1. New Service → Deploy from GitHub repo (same repo) → set **Root Directory** to `frontend`.
2. Railway auto-detects `frontend/railway.json` (build: `npm ci && npm run build`,
   start: `npm start`, which runs `serve -s dist` with SPA fallback for `react-router`).
3. Environment variables (set **before** the first build — `VITE_API_URL` is baked in at
   build time, not read at runtime):
   - `VITE_API_URL` — the backend's public URL, e.g. `https://<backend-domain>.up.railway.app`.
     You can also use a Railway reference variable so it stays in sync:
     `https://${{<backend-service-name>.RAILWAY_PUBLIC_DOMAIN}}`.
4. Generate a public domain for this service too (Settings → Networking).

## Notes

- Both services build via Nixpacks; no Dockerfile is required.
- CORS is wide open on the backend (`app.use(cors())`), so no extra config is needed
  for the frontend's origin to call it.
- Redeploy the frontend after changing `VITE_API_URL` — build-time env vars require a
  fresh build to take effect.
