# NaTIS Online Learner Licence Portal — System Report

**Document type:** Problem statement & solution overview  
**Audience:** Stakeholders, assessors, project reviewers, and technical leads  
**Version:** 1.0 — June 2026

---

## 1. Executive summary

The **NaTIS Online Learner Licence Portal** is a full-stack web application that digitises the learner licence application journey — from identity verification through to a monitored theory test and certificate of achievement.

**In Namibia today**, learner theory tests are still largely **paper-based**: candidates travel to a testing centre, sit in a hall, and **write answers by hand** on a printed exam paper. Marking is manual, results take time, and there is no practical way to take the test online from home. Application steps — documents, booking, payment — are often handled separately, in person, with paper forms and queues.

This system proposes what a **modern digital alternative** could look like: a single guided online experience from any browser, an **online theory test** with instant automated marking, and a verifier console for staff oversight. It is a production-ready prototype (Vercel, Render, Neon) that shows how paper-heavy, centre-only workflows could be replaced without dropping human verification or regulatory controls.

---

## 2. Background and context

In **Namibia**, obtaining a learner's licence requires candidates to meet identity, vision, and knowledge requirements before they may drive under supervision. The process is administered through **NaTIS** (Namibia Traffic Information System) and the **Roads Authority of Namibia**, with theory tests and applications still handled largely in person at testing centres.

### 2.1 How it works today (real world)

| Area | Current reality |
|------|-----------------|
| **Theory test** | **Paper-based, written by hand** at a testing centre — not online |
| **Test delivery** | Fixed venue, fixed session, invigilator in the room |
| **Marking** | Manual marking of answer sheets; results not instant |
| **Application steps** | Multiple in-person visits; paper forms and physical document copies |
| **Booking & payment** | Often counter, phone, or cash — not one integrated digital flow |
| **Status tracking** | Candidate must ask or return in person to know where they stand |
| **Staff oversight** | Limited digital record of who tested, when, or whether behaviour was suspicious |

This is the gap the portal is designed to address: **the learner licence process still runs on paper and in-person steps, while learners increasingly expect to apply, pay, and test online.**

### 2.2 What this system changes

| Real-world pain | Digital approach in this portal |
|-----------------|----------------------------------|
| Handwritten paper exam | **Online theory test** — 70 questions, timed, auto-marked |
| Wait for manual results | **Instant pass/fail** and score on submission |
| Travel for every step | Browser-based journey (verify, vision, book, test) |
| Paper document bundles | Upload ID, passport, face photo for verifier review |
| Unclear “what’s next?” | Guided portal with locked steps and live status |
| No live test visibility | Admin **live tests** view and flagged-attempt review |

The **Roads Authority of Namibia** and driving schools need a secure, auditable digital channel that mirrors official NaTIS requirements while remaining accessible to learners who may only have a smartphone or shared computer. This portal models that end-to-end journey in software.

---

## 3. Problems the system solves

The sections below map **real-world problems** (how learner licensing works today) to **what this portal provides**. The headline change is replacing **handwritten, centre-based paper tests** with an **online, auto-marked, monitored** theory exam — alongside digitising the rest of the application path.

### 3.1 Fragmented application journey

**Problem:** Learners must remember which step comes next, whether they are eligible to proceed, and whether previous submissions were accepted.

**Solution:** A central **candidate portal** (`/portal`) presents a four-step journey with live status tracking:

1. Identity & documents  
2. Vision screening  
3. Booking & payment  
4. Theory test  

Each step is **locked until prerequisites are met**. Progress is calculated automatically from the candidate's profile state, so the learner always knows what to do next.

---

### 3.2 Identity fraud and unverified candidates

**Problem:** Testing centres must confirm that the person taking the test is who they claim to be, using valid ID and a face match, before any assessment proceeds.

**Solution:** Candidates upload **ID or passport copies**, capture a **live face photo**, and submit personal details for review. Submissions enter a **verifier queue**. Staff approve or reject with a documented reason; rejected candidates see the reason on their portal and can resubmit.

This ensures **no candidate reaches the theory test without human verification**.

---

### 3.3 Vision requirement compliance

**Problem:** Learners must demonstrate adequate vision (or provide medical evidence) before being licensed.

**Solution:** An integrated **Snellen-style vision screening** lets candidates complete an on-screen eye test line-by-line. If they cannot pass, they may **upload a doctor's letter** as an alternative. Vision status is stored on the profile and gates access to booking.

---

### 3.4 Scheduling and payment friction

**Problem:** Booking a test slot and paying fees often requires separate systems, phone calls, or cash at the counter.

**Solution:** Candidates select a **date and time slot**, then pay via **PayPal** (or a demo payment mode for assignments). Booking and payment status are linked in the database; the theory test remains locked until payment is confirmed.

---

### 3.5 Paper-based theory tests → online, monitored assessment

**Problem (real world):** The learner theory test is still **written by hand on paper**, not taken online. That creates several practical issues:

- Candidates must **travel to a testing centre** and sit at a scheduled session — no remote or flexible option  
- **Answer sheets are marked manually**, so results are delayed and staff time is spent on admin rather than verification  
- Each candidate gets the **same fixed paper** (or limited rotation), making memorisation and sharing easier over time  
- **No digital audit trail** of who answered what, when, or under what conditions  
- Centres cannot easily see **live progress** across many candidates in one dashboard  

Moving online is not just convenience — it is a structural shift from **physical paper + invigilator in the room** to **digital delivery + software-enforced rules**.

**Solution:** This portal delivers a **full online theory test** that replaces the handwritten paper experience while adding controls paper cannot offer:

| Paper-based today | Online in this system |
|-------------------|------------------------|
| Write answers by hand | Select answers on screen; submit digitally |
| Invigilator watches the room | **Webcam monitoring** + tab-switch and face-presence checks |
| Manual marking | **Server-side auto-grading** — instant score |
| Results later | **Immediate pass/fail** on `/results` |
| Fixed question order on paper | **70 random questions** per attempt; options shuffled |
| No session telemetry | **Suspicion scoring** and flagged attempts for verifier review |

The monitored test includes:

| Control | Description |
|---------|-------------|
| **Timed session** | 70 questions, 60 minutes, 80% pass threshold |
| **Webcam monitoring** | Camera required; periodic snapshots captured |
| **Tab-switch detection** | Leaving the test window is logged |
| **Face-presence checks** | Missing or blank camera frames are flagged |
| **Server-side grading** | Correct answers never sent to the browser |
| **Randomised paper** | 70 random active questions per attempt; options shuffled |
| **Suspicion scoring** | Sessions exceeding thresholds are flagged for verifier review |

Verifiers can watch **live test sessions** on the admin dashboard and review **flagged attempts** after submission.

---

### 3.6 Retake and eligibility rules

**Problem:** Regulations restrict how soon candidates may rebook or retake after pass or fail; learners need clear messaging on when they can try again.

**Solution:** Server-enforced schedule rules:

| Scenario | Rule |
|----------|------|
| **Failed attempt** | Must wait before rebooking (5 minutes in demo; configurable via `FAIL_REBOOK_MINUTES`) |
| **Passed attempt** | 21-day wait before another test attempt |
| **Passed attempt** | Licence collection date shown as 7 days after pass |
| **Already passed** | Further tests and bookings blocked |

The portal displays countdowns and block reasons so candidates are never left guessing.

---

### 3.7 Lack of staff oversight and audit trail

**Problem:** Testing centres need visibility into pending applications, bookings, results, and verifier actions for accountability.

**Solution:** The **admin / verifier console** (`/admin`) provides:

- **Overview** — candidate counts, pending verifications, pass rates  
- **Verification queue** — document review with approve/reject  
- **Live tests** — auto-refreshing view of in-progress sessions  
- **Bookings** — recent slot reservations  
- **Attempts** — scores, pass/fail, proctoring flags  
- **Audit log** — record of verifier decisions and actions  

Every approval and rejection is attributable and traceable.

---

### 3.8 Access to official study materials

**Problem:** Learners need consistent access to official **Roads Authority of Namibia / NaTIS** study content without hunting for PDFs.

**Solution:** Official PDFs in `RoadsAuth/` are served by the API and listed on the **Study Materials** page (`/study`), including the learner's book and sample NATIS test papers.

---

### 3.9 Immediate proof of achievement

**Problem:** After passing, learners want confirmation they can show trainers, employers, or family before physical licence collection.

**Solution:** On pass, candidates receive instant **results** with score breakdown and may download a **certificate of achievement** (`/certificate`) from the portal.

---

## 4. Stakeholders and roles

| Stakeholder | Role in system | Primary needs addressed |
|-------------|----------------|-------------------------|
| **Learner / candidate** | Registers, completes journey, takes test | Clear steps, status visibility, fair testing, certificate |
| **Verifier / admin** | Reviews documents, monitors tests, audits activity | Queue management, live oversight, rejection reasons, audit trail |
| **Testing centre / institution** | Operates the platform | Reduced manual handling, digital records, scalable bookings |
| **Assessor / reviewer** | Evaluates the prototype | End-to-end demo, cloud deployment, documented API |

Access is role-based: candidates and admins sign in with ID number and password and are routed to different experiences (`/portal` vs `/admin`). Public registration always creates candidate accounts. The first admin is created through a one-time server-secret bootstrap endpoint; admin authorization is checked against the current database role and logout revokes issued tokens.

---

## 5. End-to-end candidate journey

```
Language selection → Register / Login → Portal
    │
    ├─ Step 1: Upload ID, face photo → Await verifier approval
    │
    ├─ Step 2: Vision screening OR doctor letter upload
    │
    ├─ Step 3: Book date/slot → Pay (PayPal or demo)
    │
    ├─ Step 4: Read instructions → Consent to webcam → Take theory test
    │
    └─ Results → Certificate (if pass) OR retake wait (if fail)
```

Optional at any time: **Study materials** for preparation.

---

## 6. Functional capabilities summary

| Capability | Implementation |
|------------|----------------|
| User authentication | JWT + bcrypt; register, login, logout |
| Profile management | Personal info, ID number, licence code |
| Document verification | Multipart upload; admin approve/reject with reason |
| Vision screening | Snellen component + doctor letter fallback |
| Booking | Date picker, time slots, payment gate |
| Payments | PayPal integration; sandbox/demo mode |
| Question bank | 70+ questions in Postgres; seed from JSON |
| Theory test | Timed UI, navigator, flag-for-review, webcam panel |
| Proctoring | Tab switches, face missing, snapshots, suspicion score |
| Retake scheduling | Server-side eligibility dates |
| Certificate | Printable learner certificate on pass |
| Admin dashboard | Stats, queues, live tests, audit log |
| Study PDFs | Static serve from `RoadsAuth/` |

---

## 7. Technical architecture (overview)

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Presentation** | React 18, Vite, TypeScript, Tailwind, shadcn/ui | UI, routing, client-side proctoring |
| **Application API** | Node.js 20+, Express 5 | Auth, business rules, grading, file handling |
| **Data** | Neon (PostgreSQL) | Profiles, documents, bookings, attempts, audit |
| **Hosting** | Vercel (frontend) + Render (API) | Public HTTPS deployment |
| **Payments** | PayPal JS SDK | Optional live or demo payment |

The frontend communicates with the API via `VITE_API_BASE_URL`. Protected routes require a Bearer token. Database schema is versioned in `neon/migrations/`.

---

## 8. Business rules and compliance alignment

The system encodes common learner-licence process rules:

- **80% pass mark** on 70 questions (56 correct)
- **Human verification** before test access
- **Vision gate** before booking
- **Payment gate** before test
- **Retake cooldowns** after fail or pass
- **Collection date** communicated on success
- **Proctoring review** for suspicious sessions

These rules are enforced server-side where possible (grading, eligibility, schedule), not only in the UI.

---

## 9. Outcomes and benefits

### For learners
- No need to **travel and write a paper exam by hand** — theory test taken online from a browser  
- Single portal for the entire application journey  
- Transparent status at every step  
- Prepare using official PDFs in-app  
- **Instant results** and digital certificate on pass (vs waiting for manual marking)  

### For verifiers and testing centres
- Less time on **manual marking and paper handling**  
- Centralised verification queue  
- Live visibility into ongoing **online** tests  
- Flagged attempts for follow-up  
- Full audit trail of decisions  

### For institutions and assessors
- Demonstrates modern full-stack delivery (React + API + cloud DB)  
- Deployable to production-like hosting in under an hour  
- Documented API contract and migration path  
- Extensible question bank and admin modules  

---

## 10. Scope, limitations, and future work

This is an **assignment / demonstration prototype** that shows how a digital process *could* work — it is **not** the live NaTIS production system, and **official learner theory tests in Namibia remain paper-based today**. Current limitations include:

- Document storage uses local/server paths (production would use S3 or similar)  
- PayPal demo mode available for environments without merchant accounts  
- Proctoring signals are indicative, not forensic — human review is expected  
- Question bank is seeded manually from JSON, not parsed from PDFs  
- Physical licence issuance and NaTIS backend integration are out of scope  

Natural extensions: SMS/email notifications, multi-language content beyond selection screen, deeper NaTIS API integration, biometric ID verification, and appointment capacity management per centre.

---

## 11. Conclusion

The NaTIS Online Learner Licence Portal addresses real-world friction in the learner licence journey: **paper forms, in-person-only steps, handwritten theory tests, manual marking, and limited staff visibility**. Its central proposition is moving from **pen-and-paper exams at a testing centre** to a **guided online journey** with a monitored digital theory test, instant results, and a verifier console — without removing human document approval or audit requirements.

By combining a guided candidate experience with enforced business rules and cloud-ready architecture, it demonstrates how **Namibia's** learner-licence process could be modernised for the way people actually apply and learn today, while keeping the safeguards the Roads Authority expects.

---

## Appendix A — Key URLs (local development)

| Resource | URL |
|----------|-----|
| Application | http://localhost:8080 |
| API health | http://localhost:3001/api/health |
| Candidate portal | `/portal` |
| Admin console | `/admin` |
| Study materials | `/study` |

## Appendix B — Related documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Quick start and scripts |
| [DEPLOY.md](./DEPLOY.md) | Cloud deployment guide |
| [PRESENTATION.md](./PRESENTATION.md) | Demo scripts and talking points |
| [server/README.md](./server/README.md) | API endpoints and schema |

---

*Generated from the natis-drive-learn codebase — June 2026.*
