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
- Retake rules: 3 weeks between attempts, 13 weeks after a fail, collection date on pass
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
JWT_SECRET=your-long-secret
ADMIN_EMAILS=your-email@example.com
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

## Cloud deployment

See **[DEPLOY.md](./DEPLOY.md)** — Cloudflare Pages + Render + Neon.

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
