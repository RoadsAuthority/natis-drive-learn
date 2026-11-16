# Online Learner Licence Portal

Full-stack assignment prototype: candidate registration, document verification, vision screening, booking/payment, monitored theory test, and verifier admin console.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind, shadcn/ui
- **API:** Node.js, Express, JWT
- **Database:** Neon (Postgres)

## Features

- Candidate portal with step-by-step journey
- Verifier console (approve/reject with reasons, bookings, flagged attempts, audit log)
- Snellen-style vision screening + optional doctor letter
- Timed theory test (70 questions, 80% pass) with webcam monitoring signals
- Retake rules: 3 weeks between passed attempts; **5-minute** wait after a fail (demo); collection date on pass
- Candidate profile and certificate of achievement on pass
- Study PDFs served from `RoadsAuth/`

## Quick start (local)

```bash
npm install
```

**`server/.env`** (copy from `server/.env.example`):

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:8080
DATABASE_URL="postgresql://..."
# Generate separate random values; leave ADMIN_SETUP_KEY unset after first admin setup.
JWT_SECRET=
ADMIN_SETUP_KEY=
```

**Root `.env`** (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_ALLOW_SANDBOX_PAYMENT=true
```

```bash
npm run db:migrate
npm run generate:questions
npm run seed:questions -- --replace
npm run dev:all
```

- App: http://localhost:8080  
- API health: http://localhost:3001/api/health  

Signup collects email and ID number; sign-in uses ID number and password only. After migrations, create the first admin once via `POST /api/auth/bootstrap-admin` using the setup key, then remove `ADMIN_SETUP_KEY` from the API environment. Sign in at `/login`; the protected admin URL is http://localhost:8080/admin (Vite may select another port if 8080 is occupied). See [server/README.md](./server/README.md#first-admin).

## Cloud deployment

See **[DEPLOY.md](./DEPLOY.md)** — Vercel + Render + Neon.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend only |
| `npm run dev:api` | API only (watch mode) |
| `npm run dev:all` | Both |
| `npm run build` | Production frontend build |
| `npm run start:api` | Production API |
| `npm run db:migrate` | Apply SQL migrations |

## API docs

See [server/README.md](./server/README.md) for endpoints and schema.
