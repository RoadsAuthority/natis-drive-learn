# Neon Backend API Contract

Frontend now calls REST endpoints via `VITE_API_BASE_URL` and expects a Neon-backed API.

## Required endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/profile/me`
- `POST /api/verification/submit` (multipart form-data)
- `POST /api/eye-test/submit` (multipart form-data)
- `POST /api/bookings`
- `GET /api/questions/active`
- `POST /api/attempts/mark`
- `POST /api/attempts`
- `POST /api/results/document`

## Auth expectation

- Bearer token in `Authorization` header for all protected routes.
- `GET /api/profile/me` returns profile object with fields:
  - `id`, `email`, `first_name`, `surname`, `id_number`, `licence_code`
  - `role`, `verification_status`, `eye_test_status`, `payment_status`

## Neon schema

Run migration file:

- `neon/migrations/20260426_full_v1.sql`

## Run the API

1. Copy `server/.env.example` to `server/.env` and set:
   - `DATABASE_URL` (Neon connection string)
   - `JWT_SECRET` (long random value)
2. Start backend:
   - `npm run dev:api`
3. Point frontend to backend by setting:
   - `VITE_API_BASE_URL=http://localhost:3001`

## File storage

Use your preferred storage provider (S3, Cloudinary, etc.) and persist returned file paths in:

- `verification_documents.id_copy_path`
- `verification_documents.passport_copy_path`
- `verification_documents.face_capture_path`
- `verification_documents.doctor_letter_path`

## Study PDFs (RoadsAuth)

Place official PDFs under the repo folder `RoadsAuth/` (e.g. learner book and NATIS test papers).

- Static files: `GET /study-materials/<filename>` (URL-encoded names with spaces are supported).
- JSON index for the frontend: `GET /api/study-materials/list`

The app route `/study` lists these files when `VITE_API_BASE_URL` points at this API.

## Online test question bank (not from PDF)

PDFs are not parsed into database rows automatically. To load questions into Neon:

1. Edit `data/question-bank.json` — array of objects:

   - `question` (string)
   - `options` (array of `{ "id": "a", "text": "..." }` — ids should match what the UI submits, usually `a`–`d`)
   - `correctAnswer` (string, same as one option `id`)

2. Run (from repo root, with `DATABASE_URL` in `server/.env`):

   - `npm run seed:questions` — append rows
   - `npm run seed:questions -- --replace` — delete all rows in `question_bank`, then insert (full reload)

The learner test reads active rows from `question_bank` via `GET /api/questions/active`.

## Go-live checklist (next day)

1. **Neon** — From repo root, with `DATABASE_URL` set in `server/.env`: run `npm run db:migrate` (applies `neon/migrations/20260426_full_v1.sql`). Or paste that file into the Neon SQL Editor and run it once.
2. **Secrets** — Set `DATABASE_URL`, `JWT_SECRET`, and optional `ADMIN_EMAILS` in `server/.env` (never commit `server/.env`).
3. **Question bank** — `npm run generate:questions` then `npm run seed:questions -- --replace` (loads 70 rows from `data/question-bank.json`).
4. **PDFs** — Keep official papers under `RoadsAuth/`; API serves them at `/study-materials/...`.
5. **Frontend** — Root `.env`: `VITE_API_BASE_URL` = your API origin (HTTPS in production).
6. **Process** — Candidate: portal → documents → **verifier approves** → vision → book & pay → theory test. Verifier: register with an `ADMIN_EMAILS` address, or add your email to `ADMIN_EMAILS` before registering that account.
7. **Run** — Terminal A: `npm run dev:api` · Terminal B: `npm run dev`.

## Health checks

- API + DB quick probe: `GET /api/health`
- Study file index probe: `GET /api/study-materials/list`

