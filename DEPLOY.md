# Deploy to the cloud (assignment / demo)

Stack: **Vercel** (website) + **Render** (API) + **Neon** (database).

## 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (use the **pooler** URL).
3. From your machine (with `server/.env` set):

```bash
npm run db:migrate
npm run generate:questions
npm run seed:questions -- --replace
```

## 2. API (Render)

1. Push this repo to GitHub.
2. [Render](https://render.com) → **New** → **Blueprint** (or Web Service) → connect the repo.
3. Use `render.yaml` or set manually:
   - **Build:** `npm install`
   - **Start:** `npm run start:api`
   - **Health check path:** `/api/health`
4. Environment variables:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://...` (quoted if it contains `&`) |
| `JWT_SECRET` | long random string |
| `FRONTEND_ORIGIN` | `https://your-app.vercel.app` (set after step 3) |
| `ADMIN_EMAILS` | `you@school.edu` |
| `PORT` | leave empty (Render sets it) |

5. Deploy. Note the URL, e.g. `https://natis-drive-learn-api.onrender.com`.

6. Optional: add a **disk** mounted at `server/uploads` if you need uploaded ID/face files to survive redeploys.

Verify: open `https://YOUR-API.onrender.com/api/health` → `"ok": true`.

## 3. Frontend (Vercel)

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import your GitHub repo.
2. Build settings (Vercel usually auto-detects Vite):
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Environment variables (Production):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |
| `VITE_PAYPAL_CLIENT_ID` | optional PayPal sandbox/live client id |
| `VITE_ALLOW_SANDBOX_PAYMENT` | `true` for assignment demos without PayPal |

4. Deploy. Copy the Vercel URL (e.g. `https://natis-drive-learn.vercel.app`).

5. Go back to Render → set `FRONTEND_ORIGIN` to that exact Vercel URL (no trailing slash) → redeploy API.

6. Custom domain (optional): Vercel project → **Settings** → **Domains**.

SPA routing is handled by `vercel.json` (rewrites all routes to `index.html`).

## 4. First login

1. Register with an email listed in `ADMIN_EMAILS` → verifier console at `/admin`.
2. Register a second account as a **candidate** → complete the portal flow.
3. As admin, approve the candidate, then continue booking and test on the candidate account.

## 5. Local development

```bash
# Terminal A
npm run dev:api

# Terminal B
npm run dev
```

Or: `npm run dev:all`

Root `.env`: `VITE_API_BASE_URL=http://localhost:3001`  
`server/.env`: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API terminal returns to prompt immediately | Port 3001 in use — open `/api/health` or run `.\scripts\start-api.ps1` |
| Login works but portal empty | Run `npm run db:migrate`; restart API |
| Admin attempts 500 | Run `npm run db:migrate` (applies proctoring columns). If it still fails, run `node server/scripts/fix-schema.mjs` |
| Verification submit fails | Upload ID + face photo; use smaller images; check browser toast for the API error |
| Camera blocked | Use HTTPS (Vercel) or localhost |
| CORS errors | `FRONTEND_ORIGIN` must match the exact Vercel URL (e.g. `https://your-app.vercel.app`) |
