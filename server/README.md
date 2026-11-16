# Neon Backend API Contract

Frontend now calls REST endpoints via `VITE_API_BASE_URL` and expects a Neon-backed API.

## Required endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/bootstrap-admin` (one time, server setup key required)
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
- Sign in with numeric ID number and password only; email is collected at signup and is not a login identifier.
- Registration accepts exactly `email`, `password`, `first_name`, `surname`, and `id_number`. IDs are numeric and unique; email is trimmed, lowercased, and unique.
- Passwords must be at least 12 characters and no more than 72 UTF-8 bytes.
- Public registration always creates a candidate and rejects extra fields such as `role`.
- Access tokens expire after one hour. Protected requests check the current profile and token version; logout revokes previously issued tokens.
- `GET /api/profile/me` returns profile object with fields:
  - `id`, `email`, `first_name`, `surname`, `id_number`, `licence_code`
  - `role`, `verification_status`, `eye_test_status`, `payment_status`

## Neon schema

Apply the migrations, including the auth integrity migration that adds unique ID and canonical email constraints:

- `npm run db:migrate`

## Run the API

1. Copy `server/.env.example` to `server/.env` and set:
   - `DATABASE_URL` (Neon connection string)
   - `JWT_SECRET` (at least 32 cryptographically random bytes)
   - `ADMIN_SETUP_KEY` (a different 32+ byte random secret; only needed to create the first admin)
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
   - `imageUrl` (optional string, e.g. `/question-images/stop-sign.svg` — static files in `public/question-images/`)

The learner test serves **70 random** active questions per attempt (`ORDER BY random()`). Answer options are shuffled on each load. Correct answers are graded server-side by question `id` (not sent to the browser).

2. Run (from repo root, with `DATABASE_URL` in `server/.env`):

   - `npm run seed:questions` — append rows
   - `npm run seed:questions -- --replace` — delete all rows in `question_bank`, then insert (full reload)

The learner test reads active rows from `question_bank` via `GET /api/questions/active`.

## First Admin

Run migrations first. Then call the one-time bootstrap endpoint from a trusted machine. Do not put the setup key in frontend code or commit it.

PowerShell example (replace values locally; never send the setup key through chat):

```powershell
$setupKey = "value-from-server/.env"
$admin = @{
   email = "admin@example.com"
   password = "use-a-unique-password-of-12-or-more-characters"
   first_name = "System"
   surname = "Administrator"
   id_number = "123456789"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
   -Uri "http://localhost:3001/api/auth/bootstrap-admin" `
   -Headers @{ "x-admin-setup-key" = $setupKey } `
   -ContentType "application/json" `
   -Body $admin
```

Bootstrap works only while no admin exists. Remove `ADMIN_SETUP_KEY` from the API environment and restart the API after setup. Admins sign in at `/login` with the ID number and password created above; the protected console is `/admin` (local URL: `http://localhost:8081/admin`).

## Go-live checklist (next day)

1. **Neon** — From repo root, with `DATABASE_URL` set in `server/.env`: run `npm run db:migrate` to apply the full schema and auth integrity constraints.
2. **Secrets** — Set `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_SETUP_KEY` in `server/.env` (never commit `server/.env`). Remove the setup key after the first admin is created.
3. **Question bank** — `npm run generate:questions` then `npm run seed:questions -- --replace` (loads 70 rows from `data/question-bank.json`).
4. **PDFs** — Keep official papers under `RoadsAuth/`; API serves them at `/study-materials/...`.
5. **Frontend** — Root `.env`: `VITE_API_BASE_URL` = your API origin (HTTPS in production).
6. **Process** — Create the first admin once via `/api/auth/bootstrap-admin`, then sign in at `/login` using its ID number. Candidate: portal → documents → **verifier approves** → vision → book & pay → theory test.
7. **Run** — Terminal A: `npm run dev:api` · Terminal B: `npm run dev`.

## Health checks

- API + DB quick probe: `GET /api/health`
- Study file index probe: `GET /api/study-materials/list`

