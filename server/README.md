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

