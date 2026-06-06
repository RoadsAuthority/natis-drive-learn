# NaTIS Online Learner Licence Portal — Presentation Guide

A plain-language guide for demos, client walkthroughs, and setup. Written for non-technical presenters.

---

## What this system is

This is a **web application** that simulates how a learner applies for a learner's licence online. It has two sides:

| Role | Who uses it | What they do |
|------|-------------|--------------|
| **Candidate** (learner) | Person applying for a licence | Register, upload documents, do a vision test, book & pay, take the theory test, get a certificate |
| **Verifier / Admin** | Staff at a testing centre | Review documents, approve or reject candidates, watch live tests, see bookings and results |

Think of it as a **website + database + backend server** working together — similar to online banking, but for learner licence applications.

---

## Tech stack (simple explanation)

| Layer | Technology | What it means |
|-------|------------|---------------|
| **Website (what you see)** | React + Vite | The screens, buttons, and forms in the browser |
| **Design** | Tailwind + shadcn/ui | Clean, modern look and layout |
| **Backend (brain of the system)** | Node.js + Express | Handles login, saving data, marking tests, etc. |
| **Database (storage)** | Neon (PostgreSQL) | Stores users, documents, test results, bookings |
| **Hosting (live on internet)** | Vercel (website) + Render (API) | Anyone can open a link and use it |
| **Payments** | PayPal (optional) | For booking payment; demo mode can skip real PayPal |
| **Security** | JWT tokens + bcrypt | Keeps logins secure |

**One-sentence summary for a presentation:**

> It is a modern web app built with React on the front, Node.js on the back, and a cloud database — hosted on Vercel and Render so learners use it in the browser without installing anything.

---

## What to download on your computer

### Option A — Presentation only (recommended)

If the system is **already deployed online** (e.g. on Vercel), you only need:

| Item | Why |
|------|-----|
| **Google Chrome** or **Microsoft Edge** (latest) | To open the website |
| **Stable internet** | The app runs in the cloud |

You do **not** need Node.js, Git, or a database for a live demo.

**Before presenting:** open the live URL once and log in as admin and candidate to confirm everything works.

---

### Option B — Run on your own computer (local setup)

Use this for offline demos or if someone is helping you change the code.

| # | What to install | Where to get it | Notes |
|---|-----------------|-----------------|-------|
| 1 | **Node.js 20 or newer** | https://nodejs.org | Choose **LTS**. Use default install options. |
| 2 | **Git** | https://git-scm.com/download/win | To download the project code |
| 3 | **VS Code** (optional) | https://code.visualstudio.com | To view or edit files |
| 4 | **Free Neon account** | https://neon.tech | Cloud database — no local database install |

**Check the install worked** — open PowerShell or Command Prompt and run:

```bash
node --version
npm --version
```

Node should show version **20** or higher.

---

## Local setup (for you or a technical helper)

```bash
# 1. Get the code
git clone <your-github-repo-url>
cd natis-drive-learn

# 2. Install dependencies
npm install

# 3. Copy and fill in environment files
#    server/.env  → DATABASE_URL, JWT_SECRET, ADMIN_EMAILS
#    .env         → VITE_API_BASE_URL=http://localhost:3001

# 4. One-time database setup
npm run db:migrate
npm run generate:questions
npm run seed:questions -- --replace

# 5. Start website + API together
npm run dev:all
```

Open in the browser:

- **App:** http://localhost:8080
- **API health:** http://localhost:3001/api/health

For cloud deployment (Vercel + Render + Neon), see **[DEPLOY.md](./DEPLOY.md)**.

---

## Demo accounts (set up before the presentation)

Use **two browser windows** — one normal, one **Incognito/Private** — so you can be admin and candidate at the same time.

| Account | Email | Role | After login go to |
|---------|-------|------|-------------------|
| **Verifier** | Must match `ADMIN_EMAILS` on Render (e.g. `verifier@school.edu`) | Admin | `/admin` |
| **Learner** | Any other email (e.g. `learner@example.com`) | Candidate | `/portal` |

**Passwords:** whatever you chose at registration. There is no default password.

**Important:** Register the admin account **after** `ADMIN_EMAILS` is set on Render, or that account will not get admin access.

---

## Full demo walkthrough (20-minute version)

### Part 1 — Candidate journey

| Step | Screen | What to say / do |
|------|--------|------------------|
| 1 | Home → Language → Login | "Learners start by choosing a language and signing in." |
| 2 | `/portal` | "The portal shows a four-step journey with progress tracking." |
| 3 | Step 1 — Documents | Upload ID/passport, capture face photo, submit. Portal shows **Awaiting verifier**. |
| 4 | Switch to admin | Log in as verifier → `/admin` → **Verification** tab → View documents → **Approve**. |
| 5 | Step 2 — Vision | Back to candidate → `/eye-test` → complete Snellen screening or upload doctor letter. |
| 6 | Step 3 — Booking | Pick date and slot → use **Record demo payment** (no real PayPal needed) → confirm. |
| 7 | Step 4 — Instructions | Read rules: 70 questions, 60 minutes, 80% pass → consent to webcam → Start test. |
| 8 | `/test` | Answer a few questions. Point out timer, webcam, question navigator, flagging. |
| 9 | Submit → `/results` | Show pass/fail screen, score, and next steps (certificate or retake wait). |
| 10 | `/certificate` | Show downloadable learner certificate (if passed). |
| 11 | `/study` | Optional: official PDF study materials. |

### Part 2 — Admin / verifier console

| Tab | What to highlight |
|-----|-------------------|
| **Overview** | Total candidates, pending verifications, bookings |
| **Live tests** | Candidates currently taking the test (refreshes automatically) |
| **Verification** | Document review queue — approve or reject with reason |
| **Bookings** | Recent test slot bookings |
| **Attempts** | Scores and flagged sessions for review |
| **Audit log** | Record of verifier actions |

**Closing line:** "Verifiers can monitor live tests, review suspicious behaviour, and keep a full audit trail."

---

## 5-minute presentation script

Use this when time is short. Pre-stage: candidate already verified, eye test done, booking paid — start at the portal ready for the test.

| Time | Action | Script |
|------|--------|--------|
| 0:00 | Open live URL | "This is our online learner licence portal — learners apply, verify identity, and take the theory test from any browser." |
| 0:30 | Show `/portal` | "Four clear steps: documents, vision, booking, and the theory test. Progress is tracked automatically." |
| 1:00 | Quick flash of completed steps | "Identity is verified by staff before the learner can continue." |
| 1:30 | Open `/test` (or start from instructions) | "The test has 70 questions, a 60-minute timer, and webcam monitoring — tab switches and missing face are flagged." |
| 2:30 | Answer 2–3 questions, show navigator | "Learners can move between questions and flag ones to review." |
| 3:00 | Switch to admin `/admin` → Live tests | "While the test runs, verifiers see live progress on the admin dashboard." |
| 3:30 | Submit test → `/results` | "Results are instant — pass or fail, with certificate or retake information." |
| 4:00 | Show `/certificate` or admin Attempts tab | "Passed learners get a certificate; verifiers see all attempts and flagged sessions." |
| 4:30 | One slide / closing | "Built with React, Node.js, and a cloud database — hosted on Vercel and Render for real-world deployment." |

---

## 20-minute presentation script

| Time | Section | Script |
|------|---------|--------|
| 0:00–1:00 | Introduction | Explain purpose: digital learner licence journey from registration to certificate. |
| 1:00–2:00 | Tech stack (1 slide) | React frontend, Node.js API, Neon database, Vercel + Render hosting. |
| 2:00–4:00 | Register & portal | Register candidate, show portal and four-step journey. |
| 4:00–7:00 | Document verification | Upload ID, face capture, submit. Switch to admin, approve in verification queue. |
| 7:00–9:00 | Vision & booking | Complete eye test. Book slot and demo payment. |
| 9:00–11:00 | Test instructions | Rules, webcam consent, monitoring explanation. |
| 11:00–15:00 | Live test | Take several questions. Show timer sync, webcam panel, admin live view in second window. |
| 15:00–17:00 | Results & certificate | Submit, show score, certificate, collection date on pass. |
| 17:00–19:00 | Admin console tour | Stats, bookings, attempts, audit log. |
| 19:00–20:00 | Q&A / wrap-up | Retake rules (5 min demo wait after fail), study PDFs, deployment options. |

---

## Key talking points

1. **Guided journey** — steps unlock only when previous ones are complete.
2. **Human verification** — real staff approve documents before testing.
3. **Vision screening** — on-screen test or doctor letter upload.
4. **Booking & payment** — slot selection with PayPal or demo payment.
5. **Monitored theory test** — timed, webcam, anti-cheating signals (tab switches, face missing).
6. **Retake rules** — 5-minute wait after fail (demo); 3-week rule in production-style wording.
7. **Certificate** — issued immediately on pass.
8. **Admin oversight** — live tests, flagged attempts, audit log.

---

## Cloud vs local — quick decision

| Goal | What you need |
|------|---------------|
| Present to a class or client | Browser + live URL only |
| Develop or customise | Node.js, Git, Neon account, project code |
| Keep running online 24/7 | Vercel + Render + Neon (free tiers work for demos) |

---

## Troubleshooting on demo day

| Problem | Fix |
|---------|-----|
| Login fails | Check internet; confirm `VITE_API_BASE_URL` on Vercel points to Render API |
| Portal empty after login | Run `npm run db:migrate` on the database |
| Camera blocked | Use HTTPS (live Vercel URL) or localhost — not plain HTTP |
| No demo payment button | Set `VITE_ALLOW_SANDBOX_PAYMENT=true` on Vercel, then redeploy |
| Admin console empty | Register admin **after** `ADMIN_EMAILS` is set on Render |
| Admin attempts error | Run `npm run db:migrate` or `node server/scripts/fix-schema.mjs` |
| Wrong time on retake message | Redeploy latest frontend and API (times use local clock) |

---

## Pre-demo checklist

- [ ] Live URL opens in browser
- [ ] API health check returns OK: `https://YOUR-API.onrender.com/api/health`
- [ ] Admin account registered and can open `/admin`
- [ ] Candidate account registered
- [ ] Candidate documents submitted (or pre-approved for short demo)
- [ ] Webcam permission allowed in browser
- [ ] Second browser window (Incognito) ready for dual-role demo
- [ ] Internet connection tested at presentation venue

---

## One-page summary (print this)

**System:** NaTIS Online Learner Licence Portal

**Purpose:** Online learner licence application — documents, vision test, booking, monitored theory test, verifier console

**Built with:** React + Node.js + Neon (PostgreSQL)

**Hosted on:** Vercel (website) + Render (API) + Neon (database)

**To present:** Chrome/Edge + live URL + two test accounts

**To install locally:** Node.js 20+, Git, free Neon account — then `npm install` and `npm run dev:all`

**Demo flow:** Register → verify documents → vision → book & pay → theory test → results → certificate

**Admin URL:** `/admin` (verifier account only)
