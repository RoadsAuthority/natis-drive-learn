import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { addDays, buildScheduleState, deriveReviewFlag, failRebookAfter } from "./lib/testSchedule.js";
import { TEST_QUESTION_LIMIT, formatQuestionForClient, gradeAnswersByQuestionIds } from "./lib/questions.js";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [path.resolve(serverDir, ".env")];

function loadServerEnvFallback() {
  envCandidates.forEach((envPath) => {
    dotenv.config({ path: envPath, override: true });
    try {
      const raw = readFileSync(envPath, "utf8");
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const separator = trimmed.indexOf("=");
        if (separator === -1) return;
        const key = trimmed.slice(0, separator).trim();
        let value = trimmed.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      });
    } catch {
      // Ignore missing file; standard env variables may still be present.
    }
  });
}

loadServerEnvFallback();

function readEnvValue(key) {
  for (const envPath of envCandidates) {
    try {
      const raw = readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator === -1) continue;
        const currentKey = trimmed.slice(0, separator).trim();
        if (currentKey !== key) continue;
        return trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      }
    } catch {
      // Ignore missing files while checking candidates.
    }
  }
  return undefined;
}

const app = express();
const port = Number(process.env.PORT ?? readEnvValue("PORT") ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? readEnvValue("FRONTEND_ORIGIN") ?? "http://localhost:8080";
const jwtSecret = process.env.JWT_SECRET ?? readEnvValue("JWT_SECRET") ?? "replace-this-in-production";
const databaseUrl = process.env.DATABASE_URL ?? readEnvValue("DATABASE_URL");
const adminEmailSet = new Set(
  (process.env.ADMIN_EMAILS ?? readEnvValue("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

const sql = neon(databaseUrl);
const upload = multer({ storage: multer.memoryStorage() });
const uploadsDir = path.resolve(serverDir, "uploads");
const roadsAuthDir = path.resolve(process.cwd(), "RoadsAuth");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin === frontendOrigin) return callback(null, true);
      try {
        const { hostname } = new URL(origin);
        if (hostname === "localhost" || hostname === "127.0.0.1") return callback(null, true);
        if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return callback(null, true);
        if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return callback(null, true);
        if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return callback(null, true);
      } catch {
        // ignore
      }
      return callback(null, false);
    },
    credentials: false,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use("/study-materials", express.static(roadsAuthDir));

app.get("/api/health", async (_req, res) => {
  try {
    const [probe] = await sql`select now() as db_now`;
    return res.json({
      ok: true,
      service: "natis-api",
      db: "up",
      db_now: probe?.db_now ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      ok: false,
      service: "natis-api",
      db: "down",
      error: message,
    });
  }
});

app.get("/api/study-materials/list", async (_req, res) => {
  try {
    const names = await readdir(roadsAuthDir);
    const pdfs = names.filter((n) => n.toLowerCase().endsWith(".pdf")).sort();
    res.json({
      basePath: "/study-materials",
      files: pdfs.map((name) => ({
        name,
        url: `/study-materials/${encodeURIComponent(name)}`,
      })),
    });
  } catch {
    res.json({ basePath: "/study-materials", files: [] });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token." });
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
}

function isMissingSchemaError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("does not exist");
}

async function getLearnerSchedule(profileId) {
  const [profile] = await sql`
    select
      id,
      verification_status,
      eye_test_status,
      payment_status
    from profiles
    where id = ${profileId}
    limit 1
  `;
  if (!profile) {
    return null;
  }

  let scheduleFields = {
    next_test_eligible_at: null,
    next_booking_eligible_at: null,
    license_collection_from: null,
  };
  try {
    const [extra] = await sql`
      select next_test_eligible_at, next_booking_eligible_at, license_collection_from
      from profiles
      where id = ${profileId}
      limit 1
    `;
    if (extra) {
      scheduleFields = extra;
    }
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
  }

  const [lastAttempt] = await sql`
    select id, score, total, percentage, passed, created_at
    from attempts
    where profile_id = ${profileId}
    order by created_at desc
    limit 1
  `;
  const mergedProfile = { ...profile, ...scheduleFields };
  return {
    profile: mergedProfile,
    lastAttempt: lastAttempt ?? null,
    schedule: buildScheduleState(mergedProfile, lastAttempt ?? null),
  };
}

async function assertLearnerTestReady(profileId) {
  const learner = await getLearnerSchedule(profileId);
  if (!learner) {
    return { ok: false, status: 404, message: "Profile not found." };
  }
  const p = learner.profile;
  if (p.verification_status !== "approved") {
    return { ok: false, status: 403, message: "NaTIS: profile verification must be approved before the learner test." };
  }
  if (!["passed", "uploaded"].includes(p.eye_test_status)) {
    return { ok: false, status: 403, message: "NaTIS: vision screening must be completed before the learner test." };
  }
  if (p.payment_status !== "paid") {
    return { ok: false, status: 403, message: "NaTIS: booking payment must be completed before the learner test." };
  }
  if (!learner.schedule.canTakeTest) {
    return {
      ok: false,
      status: 403,
      message: learner.schedule.testBlockReason ?? "NaTIS: you are not eligible to take the test yet.",
    };
  }
  return { ok: true };
}

async function ensureDir(relativeDir) {
  const full = path.join(uploadsDir, relativeDir);
  await mkdir(full, { recursive: true });
  return full;
}

async function persistBuffer(relativeDir, filename, buffer) {
  const targetDir = await ensureDir(relativeDir);
  const fullPath = path.join(targetDir, filename);
  await writeFile(fullPath, buffer);
  return `/uploads/${relativeDir}/${filename}`.replaceAll("\\", "/");
}

const MAX_DOCUMENT_DATA_BYTES = 6 * 1024 * 1024;

const ADMIN_DOCUMENT_KINDS = {
  id: { data: "id_copy_data", path: "id_copy_path" },
  passport: { data: "passport_copy_data", path: "passport_copy_path" },
  face: { data: "face_capture_data", path: "face_capture_path" },
  doctor: { data: null, path: "doctor_letter_path" },
};

function parseStoredDataUrl(dataUrl) {
  if (!dataUrl?.startsWith("data:")) return null;
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

function bufferToDataUrl(mimetype, buffer) {
  if (!buffer?.length || buffer.length > MAX_DOCUMENT_DATA_BYTES) {
    return null;
  }
  const type = mimetype?.startsWith("image/") || mimetype === "application/pdf" ? mimetype : "application/octet-stream";
  return `data:${type};base64,${buffer.toString("base64")}`;
}

function dataUrlFromBase64Field(value) {
  if (!value?.startsWith("data:")) return null;
  return value;
}

async function persistProctoringSnapshots(profileId, snapshots = []) {
  const stored = [];
  for (const [index, snapshot] of snapshots.slice(0, 5).entries()) {
    if (!snapshot?.startsWith("data:image")) continue;
    const buffer = Buffer.from(snapshot.split(",")[1] ?? "", "base64");
    const relativePath = await persistBuffer(
      `proctoring/${profileId}`,
      `snapshot-${Date.now()}-${index}.jpg`,
      buffer
    );
    stored.push(relativePath);
  }
  return stored;
}

app.post("/api/auth/register", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    first_name: z.string().optional(),
    surname: z.string().optional(),
    id_number: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid registration payload." });
  }

  const { email, password, first_name, surname, id_number } = parsed.data;
  const existing = await sql`select id from profiles where email = ${email} limit 1`;
  if (existing.length) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const role = adminEmailSet.has(email.toLowerCase()) ? "admin" : "candidate";
  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    insert into profiles (email, password_hash, first_name, surname, id_number, role)
    values (${email}, ${passwordHash}, ${first_name ?? null}, ${surname ?? null}, ${id_number ?? null}, ${role})
    returning id, email, role
  `;
  const profile = rows[0];
  const token = jwt.sign({ sub: profile.id, role: profile.role, email: profile.email }, jwtSecret, {
    expiresIn: "7d",
  });
  return res.status(201).json({
    token,
    user: { id: profile.id, email: profile.email },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().min(1),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login payload." });
  }
  const { email, password } = parsed.data;
  const identifier = email.trim();
  try {
    const rows = await sql`
      select id, email, role, password_hash
      from profiles
      where lower(email) = lower(${identifier}) or id_number = ${identifier}
      limit 1
    `;
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const profile = rows[0];
    if (!profile.password_hash) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign({ sub: profile.id, role: profile.role, email: profile.email }, jwtSecret, {
      expiresIn: "7d",
    });
    return res.json({
      token,
      user: { id: profile.id, email: profile.email },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Login failed:", message);
    return res.status(500).json({ message: "Login failed. Check the API server logs and database connection." });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  return res.status(204).send();
});

app.get("/api/profile/me", authMiddleware, async (req, res) => {
  const profileId = req.user.sub;
  try {
    const rows = await sql`
      select
        p.id,
        p.email,
        p.first_name,
        p.surname,
        p.id_number,
        p.licence_code,
        p.role,
        p.verification_status,
        p.eye_test_status,
        p.payment_status,
        rej.reason as rejection_reason
      from profiles
      p
      left join lateral (
        select metadata->>'reason' as reason
        from admin_audit_logs
        where target_type = 'profile'
          and target_id = ${profileId}
          and action = 'verification_rejected'
        order by created_at desc
        limit 1
      ) rej on true
      where p.id = ${profileId}
      limit 1
    `;
    if (!rows.length) {
      return res.status(404).json({ message: "Profile not found." });
    }
    const learner = await getLearnerSchedule(profileId);
    const schedule = learner?.schedule;
    const lastAttempt = learner?.lastAttempt;
    return res.json({
      ...rows[0],
      test_schedule: schedule
        ? {
            can_take_test: schedule.canTakeTest,
            can_book_test: schedule.canBookTest,
            test_block_reason: schedule.testBlockReason,
            booking_block_reason: schedule.bookingBlockReason,
            next_test_eligible_at: schedule.nextTestEligibleAt?.toISOString() ?? null,
            next_booking_eligible_at: schedule.nextBookingEligibleAt?.toISOString() ?? null,
            license_collection_from: schedule.licenseCollectionFrom?.toISOString() ?? null,
            last_attempt_at: schedule.lastAttemptAt?.toISOString() ?? null,
            last_attempt_passed: schedule.lastAttemptPassed,
            last_attempt_failed: schedule.lastAttemptFailed,
            last_attempt_score: lastAttempt?.score ?? null,
            last_attempt_total: lastAttempt?.total ?? null,
            last_attempt_percentage: lastAttempt?.percentage != null ? Number(lastAttempt.percentage) : null,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Profile lookup failed:", message);
    return res.status(500).json({
      message: isMissingSchemaError(error)
        ? "Database schema is out of date. Run npm run db:migrate and restart the API."
        : "Could not load profile.",
    });
  }
});

app.get("/api/certificate/me", authMiddleware, async (req, res) => {
  const profileId = req.user.sub;
  try {
    const [profile] = await sql`
      select first_name, surname, id_number, licence_code, email
      from profiles
      where id = ${profileId}
      limit 1
    `;
    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }
    const [attempt] = await sql`
      select id, score, total, percentage, created_at
      from attempts
      where profile_id = ${profileId} and passed = true
      order by created_at desc
      limit 1
    `;
    if (!attempt) {
      return res.status(404).json({
        message: "Your certificate is available after you pass the learner theory test.",
      });
    }
    const fullName = [profile.first_name, profile.surname].filter(Boolean).join(" ").trim() || profile.email;
    return res.json({
      fullName,
      idNumber: profile.id_number,
      licenceCode: profile.licence_code ?? "B",
      email: profile.email,
      score: attempt.score,
      total: attempt.total,
      percentage: Number(attempt.percentage),
      passedAt: attempt.created_at,
      certificateId: `NATIS-LT-${String(attempt.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Certificate lookup failed:", message);
    return res.status(500).json({ message: "Could not load certificate." });
  }
});

app.post(
  "/api/verification/submit",
  authMiddleware,
  upload.fields([
    { name: "idCopy", maxCount: 1 },
    { name: "passportCopy", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const profileId = req.user.sub;
      const { firstName, surname, idNumber, licenceCode, faceCaptureBase64 } = req.body;

      const files = req.files ?? {};
      const idCopy = files.idCopy?.[0] ?? null;
      const passportCopy = files.passportCopy?.[0] ?? null;

      if (!idCopy && !passportCopy) {
        return res.status(400).json({ message: "Upload an ID copy or passport." });
      }
      if (!faceCaptureBase64?.startsWith("data:image")) {
        return res.status(400).json({ message: "Capture or upload a face photo before submitting." });
      }

      let idPath = null;
      let passportPath = null;
      let facePath = null;
      let idCopyData = null;
      let passportCopyData = null;
      let faceCaptureData = dataUrlFromBase64Field(faceCaptureBase64) ?? null;

      if (idCopy) {
        idPath = await persistBuffer(`verification/${profileId}`, `id-${Date.now()}-${idCopy.originalname}`, idCopy.buffer);
        idCopyData = bufferToDataUrl(idCopy.mimetype, idCopy.buffer);
      }
      if (passportCopy) {
        passportPath = await persistBuffer(
          `verification/${profileId}`,
          `passport-${Date.now()}-${passportCopy.originalname}`,
          passportCopy.buffer
        );
        passportCopyData = bufferToDataUrl(passportCopy.mimetype, passportCopy.buffer);
      }
      if (!faceCaptureData && faceCaptureBase64?.startsWith("data:image")) {
        const buffer = Buffer.from(faceCaptureBase64.split(",")[1] ?? "", "base64");
        facePath = await persistBuffer(`verification/${profileId}`, `face-${Date.now()}.png`, buffer);
        faceCaptureData = faceCaptureBase64;
      } else if (faceCaptureData) {
        const buffer = Buffer.from(faceCaptureBase64.split(",")[1] ?? "", "base64");
        facePath = await persistBuffer(`verification/${profileId}`, `face-${Date.now()}.jpg`, buffer);
      }

      await sql`
        update profiles
        set first_name = ${firstName ?? null},
            surname = ${surname ?? null},
            id_number = ${idNumber ?? null},
            licence_code = ${licenceCode ?? null},
            verification_status = 'pending',
            updated_at = now()
        where id = ${profileId}
      `;

      await sql`
        insert into verification_documents (
          profile_id,
          id_copy_path,
          passport_copy_path,
          face_capture_path,
          id_copy_data,
          passport_copy_data,
          face_capture_data,
          review_status
        )
        values (
          ${profileId},
          ${idPath},
          ${passportPath},
          ${facePath},
          ${idCopyData},
          ${passportCopyData},
          ${faceCaptureData},
          'pending'
        )
      `;

      return res.status(201).json({ message: "Verification submitted." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Verification submit failed:", message);
      return res.status(500).json({
        message: isMissingSchemaError(error)
          ? "Database schema is out of date. Run npm run db:migrate and restart the API."
          : "Could not save verification documents. Try smaller image files and submit again.",
      });
    }
  }
);

app.post("/api/eye-test/submit", authMiddleware, upload.single("doctorLetter"), async (req, res) => {
  const profileId = req.user.sub;
  const status = req.body.status;
  if (!["passed", "uploaded"].includes(status)) {
    return res.status(400).json({ message: "Invalid eye test status." });
  }

  const [pre] = await sql`
    select verification_status from profiles where id = ${profileId} limit 1
  `;
  if (!pre) {
    return res.status(404).json({ message: "Profile not found." });
  }
  if (pre.verification_status === "rejected") {
    return res.status(403).json({ message: "Cannot submit vision results for a rejected application." });
  }

  let doctorPath = null;
  if (req.file) {
    doctorPath = await persistBuffer(
      `verification/${profileId}`,
      `doctor-${Date.now()}-${req.file.originalname}`,
      req.file.buffer
    );
  }

  await sql`
    update profiles
    set eye_test_status = ${status},
        updated_at = now()
    where id = ${profileId}
  `;

  if (doctorPath) {
    await sql`
      insert into verification_documents (profile_id, doctor_letter_path, review_status)
      values (${profileId}, ${doctorPath}, 'pending')
    `;
  }

  return res.json({ message: "Eye test submitted." });
});

app.post("/api/bookings", authMiddleware, async (req, res) => {
  const schema = z.object({
    bookingDate: z.string().min(1),
    slotTime: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid booking payload." });
  }
  const profileId = req.user.sub;
  const { bookingDate, slotTime } = parsed.data;

  const [prow] = await sql`
    select verification_status, eye_test_status from profiles where id = ${profileId} limit 1
  `;
  if (!prow) {
    return res.status(404).json({ message: "Profile not found." });
  }
  if (prow.verification_status !== "approved") {
    return res.status(403).json({ message: "NaTIS: online booking opens only after identity verification is approved." });
  }
  if (!["passed", "uploaded"].includes(prow.eye_test_status)) {
    return res.status(403).json({ message: "NaTIS: complete the vision step before booking a test slot." });
  }

  const learner = await getLearnerSchedule(profileId);
  if (!learner?.schedule.canBookTest) {
    return res.status(403).json({
      message: learner?.schedule.bookingBlockReason ?? "NaTIS: you cannot register for another test yet.",
    });
  }

  const [latestPayment] = await sql`
    select id, status
    from payments
    where profile_id = ${profileId}
    order by created_at desc
    limit 1
  `;
  if (!latestPayment || latestPayment.status !== "completed") {
    return res.status(403).json({ message: "NaTIS: a completed payment is required before booking." });
  }

  await sql`
    insert into bookings (profile_id, booking_date, slot_time, status)
    values (${profileId}, ${bookingDate}, ${slotTime}, 'confirmed')
  `;

  return res.status(201).json({ message: "Booking created." });
});

app.post("/api/payments/confirm", authMiddleware, async (req, res) => {
  const schema = z.object({
    provider: z.string().default("paypal"),
    providerOrderId: z.string().min(1),
    amount: z.number().positive().default(12),
    status: z.enum(["completed", "failed"]).default("completed"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payment confirmation payload." });
  }

  const profileId = req.user.sub;
  const { provider, providerOrderId, amount, status } = parsed.data;
  await sql`
    insert into payments (profile_id, provider, provider_order_id, amount, status)
    values (${profileId}, ${provider}, ${providerOrderId}, ${amount}, ${status})
  `;

  if (status === "completed") {
    await sql`
      update profiles
      set payment_status = 'paid', updated_at = now()
      where id = ${profileId}
    `;
  }

  return res.status(201).json({ message: "Payment status recorded.", status });
});

app.get("/api/questions/active", authMiddleware, async (req, res) => {
  const gate = await assertLearnerTestReady(req.user.sub);
  if (!gate.ok) {
    return res.status(gate.status).json({ message: gate.message });
  }
  const rows = await sql`
    select id, question_text, options_json, image_url
    from question_bank
    where is_active = true
    order by random()
    limit ${TEST_QUESTION_LIMIT}
  `;

  if (!rows.length) {
    return res.json([
      {
        id: "fallback-1",
        question: "What does a red traffic light mean?",
        options: [
          { id: "a", text: "Proceed with caution" },
          { id: "b", text: "Stop" },
          { id: "c", text: "Speed up" },
          { id: "d", text: "Pedestrians only" },
        ],
        imageUrl: "/question-images/stop-sign.svg",
      },
    ]);
  }

  return res.json(rows.map(formatQuestionForClient));
});

const LIVE_SESSION_STALE_SECONDS = 90;

async function clearStaleTestSessions() {
  await sql`
    delete from active_test_sessions
    where last_heartbeat_at < now() - (${LIVE_SESSION_STALE_SECONDS} * interval '1 second')
  `;
}

async function endActiveTestSession(profileId) {
  await sql`delete from active_test_sessions where profile_id = ${profileId}`;
}

app.post("/api/test-session/heartbeat", authMiddleware, async (req, res) => {
  const profileId = req.user.sub;
  const schema = z.object({
    currentQuestion: z.number().int().min(1),
    totalQuestions: z.number().int().positive(),
    answeredCount: z.number().int().min(0),
    tabSwitches: z.number().int().min(0),
    faceMissingEvents: z.number().int().min(0),
    snapshot: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid heartbeat payload." });
  }

  const { currentQuestion, totalQuestions, answeredCount, tabSwitches, faceMissingEvents, snapshot } = parsed.data;
  const snapshotData = snapshot?.startsWith("data:image") ? snapshot : null;

  try {
    await clearStaleTestSessions();
    await sql`
      insert into active_test_sessions (
        profile_id,
        current_question,
        total_questions,
        answered_count,
        tab_switches,
        face_missing_events,
        latest_snapshot_data
      )
      values (
        ${profileId},
        ${currentQuestion},
        ${totalQuestions},
        ${answeredCount},
        ${tabSwitches},
        ${faceMissingEvents},
        ${snapshotData}
      )
      on conflict (profile_id) do update set
        last_heartbeat_at = now(),
        current_question = ${currentQuestion},
        total_questions = ${totalQuestions},
        answered_count = ${answeredCount},
        tab_switches = ${tabSwitches},
        face_missing_events = ${faceMissingEvents},
        latest_snapshot_data = coalesce(${snapshotData}, active_test_sessions.latest_snapshot_data)
    `;
    return res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Test session heartbeat failed:", message);
    return res.status(500).json({
      message: isMissingSchemaError(error)
        ? "Live monitoring is unavailable until database migrations are applied."
        : "Could not update test session.",
    });
  }
});

app.post("/api/test-session/end", authMiddleware, async (req, res) => {
  try {
    await endActiveTestSession(req.user.sub);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Test session end failed:", message);
    return res.status(500).json({ message: "Could not end test session." });
  }
});

app.post("/api/attempts/mark", authMiddleware, async (req, res) => {
  const gate = await assertLearnerTestReady(req.user.sub);
  if (!gate.ok) {
    return res.status(gate.status).json({ message: gate.message });
  }
  const schema = z.object({
    answers: z.record(z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid marking payload." });
  }

  const { answers } = parsed.data;
  if (!Object.keys(answers).length) {
    return res.status(400).json({ message: "No answers submitted." });
  }

  try {
    const result = await gradeAnswersByQuestionIds(sql, answers);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Attempt marking failed:", message);
    return res.status(500).json({ message: "Could not mark the test. Please try again." });
  }
});

app.post("/api/attempts", authMiddleware, async (req, res) => {
  const gate = await assertLearnerTestReady(req.user.sub);
  if (!gate.ok) {
    return res.status(gate.status).json({ message: gate.message });
  }
  const schema = z.object({
    score: z.number().int().min(0),
    total: z.number().int().positive(),
    percentage: z.number(),
    passed: z.boolean(),
    proctoring: z
      .object({
        tabSwitches: z.number().int().min(0).default(0),
        faceMissingEvents: z.number().int().min(0).default(0),
        snapshots: z.array(z.string()).max(5).optional(),
      })
      .optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid attempt payload." });
  }
  const profileId = req.user.sub;
  const { score, total, percentage, passed, proctoring } = parsed.data;
  const snapshotPaths = await persistProctoringSnapshots(profileId, proctoring?.snapshots ?? []);
  const suspicionScore = (proctoring?.tabSwitches ?? 0) * 10 + (proctoring?.faceMissingEvents ?? 0) * 15;
  const proctoringSummary = {
    tabSwitches: proctoring?.tabSwitches ?? 0,
    faceMissingEvents: proctoring?.faceMissingEvents ?? 0,
    snapshotCount: snapshotPaths.length,
    snapshotPaths,
    recordedAt: new Date().toISOString(),
  };
  const reviewFlagged = deriveReviewFlag(proctoringSummary, suspicionScore);
  const attemptAt = new Date();
  const nextTestEligibleAt = passed ? addDays(attemptAt, 21) : failRebookAfter(attemptAt);
  const nextBookingEligibleAt = passed ? null : failRebookAfter(attemptAt);
  const licenseCollectionFrom = passed ? addDays(attemptAt, 7) : null;

  await sql`
    insert into attempts (profile_id, score, total, percentage, passed, review_flagged, suspicion_score, proctoring_summary)
    values (${profileId}, ${score}, ${total}, ${percentage}, ${passed}, ${reviewFlagged}, ${suspicionScore}, ${JSON.stringify(proctoringSummary)})
  `;
  await endActiveTestSession(profileId);
  await sql`
    update profiles
    set
      next_test_eligible_at = ${nextTestEligibleAt.toISOString()},
      next_booking_eligible_at = ${nextBookingEligibleAt?.toISOString() ?? null},
      license_collection_from = ${licenseCollectionFrom?.toISOString() ?? null},
      updated_at = now()
    where id = ${profileId}
  `;
  return res.status(201).json({
    message: "Attempt saved.",
    reviewFlagged,
    suspicionScore,
    nextTestEligibleAt: nextTestEligibleAt.toISOString(),
    nextBookingEligibleAt: nextBookingEligibleAt?.toISOString() ?? null,
    licenseCollectionFrom: licenseCollectionFrom?.toISOString() ?? null,
  });
});

app.post("/api/results/document", authMiddleware, async (req, res) => {
  const profileId = req.user.sub;
  const results = req.body?.results ?? {};
  const filename = `result-${profileId}-${randomUUID()}.txt`;
  const content = [
    "NaTIS Learner Test Result",
    `Date: ${new Date().toISOString()}`,
    `Score: ${results.score ?? "N/A"}/${results.total ?? "N/A"}`,
    `Percentage: ${results.percentage ?? "N/A"}`,
    `Status: ${results.passed ? "PASSED" : "FAILED"}`,
  ].join("\n");

  const relativePath = await persistBuffer("results", filename, Buffer.from(content, "utf8"));
  return res.json({ message: "Result document generated.", path: relativePath });
});

app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (_req, res) => {
  const [p] = await sql`select count(*)::int as c from profiles`;
  const [pend] = await sql`select count(*)::int as c from profiles where verification_status = 'pending' and role = 'candidate'`;
  const [bk] = await sql`select count(*)::int as c from bookings`;
  const [att] = await sql`select count(*)::int as c from attempts`;
  const [passed] = await sql`select count(*)::int as c from attempts where passed = true`;
  const [qcount] = await sql`select count(*)::int as c from question_bank where is_active = true`;
  return res.json({
    totalProfiles: p.c,
    pendingVerification: pend.c,
    totalBookings: bk.c,
    totalAttempts: att.c,
    passedAttempts: passed.c,
    activeQuestions: qcount.c,
  });
});

app.get("/api/admin/documents/:profileId/:kind", authMiddleware, adminMiddleware, async (req, res) => {
  const { profileId, kind } = req.params;
  const mapping = ADMIN_DOCUMENT_KINDS[kind];
  if (!mapping) {
    return res.status(400).json({ message: "Invalid document type." });
  }

  try {
    const [row] = await sql`
      select
        id_copy_data,
        passport_copy_data,
        face_capture_data,
        doctor_letter_path,
        id_copy_path,
        passport_copy_path,
        face_capture_path
      from verification_documents
      where profile_id = ${profileId}
      order by created_at desc
      limit 1
    `;
    if (!row) {
      return res.status(404).json({ message: "No documents found for this candidate." });
    }

    if (mapping.data) {
      const parsed = parseStoredDataUrl(row[mapping.data]);
      if (parsed) {
        res.setHeader("Content-Type", parsed.mime);
        res.setHeader("Cache-Control", "private, max-age=3600");
        return res.send(parsed.buffer);
      }
    }

    const storedPath = row[mapping.path];
    if (storedPath) {
      const relative = storedPath.replace(/^\/uploads\/?/, "");
      const fullPath = path.join(uploadsDir, relative);
      try {
        const buffer = await readFile(fullPath);
        res.setHeader("Content-Type", mimeFromFilename(fullPath));
        res.setHeader("Cache-Control", "private, max-age=300");
        return res.send(buffer);
      } catch {
        // Disk copy missing (common on Render after redeploy).
      }
    }

    return res.status(404).json({
      message:
        "Document not available. Ask the candidate to resubmit verification (files are stored in the database on new submissions).",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin document fetch failed:", message);
    return res.status(500).json({
      message: isMissingSchemaError(error)
        ? "Database schema is out of date. Run npm run db:migrate and restart the API."
        : "Could not load document.",
    });
  }
});

app.get("/api/admin/verification-queue", authMiddleware, adminMiddleware, async (_req, res) => {
  const rows = await sql`
    select
      p.id,
      p.email,
      p.first_name,
      p.surname,
      p.id_number,
      p.verification_status,
      p.created_at,
      vd.id_copy_path,
      vd.passport_copy_path,
      vd.face_capture_path,
      vd.doctor_letter_path,
      (vd.id_copy_data is not null or vd.id_copy_path is not null) as has_id_copy,
      (vd.passport_copy_data is not null or vd.passport_copy_path is not null) as has_passport_copy,
      (vd.face_capture_data is not null or vd.face_capture_path is not null) as has_face_capture,
      (vd.doctor_letter_path is not null) as has_doctor_letter,
      vd.created_at as documents_updated_at
    from profiles p
    left join lateral (
      select
        id_copy_path,
        passport_copy_path,
        face_capture_path,
        id_copy_data,
        passport_copy_data,
        face_capture_data,
        doctor_letter_path,
        created_at
      from verification_documents
      where profile_id = p.id
      order by created_at desc
      limit 1
    ) vd on true
    where p.role = 'candidate' and p.verification_status = 'pending'
    order by p.created_at asc
    limit 100
  `;
  return res.json(rows);
});

app.get("/api/admin/bookings", authMiddleware, adminMiddleware, async (_req, res) => {
  const rows = await sql`
    select b.id, b.booking_date, b.slot_time, b.status, b.created_at, p.email, p.first_name, p.surname
    from bookings b
    join profiles p on p.id = b.profile_id
    order by b.created_at desc
    limit 100
  `;
  return res.json(rows);
});

app.get("/api/admin/live-tests", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    await clearStaleTestSessions();
    const rows = await sql`
      select
        s.profile_id,
        s.started_at,
        s.last_heartbeat_at,
        s.current_question,
        s.total_questions,
        s.answered_count,
        s.tab_switches,
        s.face_missing_events,
        s.latest_snapshot_data,
        p.email,
        p.first_name,
        p.surname
      from active_test_sessions s
      join profiles p on p.id = s.profile_id
      where s.last_heartbeat_at >= now() - (${LIVE_SESSION_STALE_SECONDS} * interval '1 second')
      order by s.started_at desc
    `;
    return res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin live tests failed:", message);
    return res.status(500).json({
      message: isMissingSchemaError(error)
        ? "Database schema is out of date. Run npm run db:migrate and restart the API."
        : "Could not load live test sessions.",
    });
  }
});

app.get("/api/admin/attempts", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const rows = await sql`
      select a.id, a.score, a.total, a.percentage, a.passed, a.review_flagged, a.suspicion_score, a.created_at, p.email
      from attempts a
      join profiles p on p.id = a.profile_id
      order by a.created_at desc
      limit 100
    `;
    return res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin attempts failed:", message);
    return res.status(500).json({
      message: isMissingSchemaError(error)
        ? "Database schema is out of date. Run npm run db:migrate and restart the API."
        : "Could not load attempts.",
    });
  }
});

app.get("/api/admin/audit", authMiddleware, adminMiddleware, async (_req, res) => {
  const rows = await sql`
    select l.id, l.action, l.target_type, l.target_id, l.metadata, l.created_at, p.email as admin_email
    from admin_audit_logs l
    left join profiles p on p.id = l.admin_id
    order by l.created_at desc
    limit 100
  `;
  return res.json(rows);
});

app.post("/api/admin/verification/:profileId", authMiddleware, adminMiddleware, async (req, res) => {
  const schema = z.object({
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Body must include decision: approved | rejected" });
  }
  const { profileId } = req.params;
  const { decision, reason } = parsed.data;
  if (decision === "rejected" && !reason?.trim()) {
    return res.status(400).json({ message: "A rejection reason is required." });
  }
  const updated = await sql`
    update profiles
    set verification_status = ${decision}, updated_at = now()
    where id = ${profileId} and role = 'candidate'
    returning id, email, verification_status
  `;
  if (!updated.length) {
    return res.status(404).json({ message: "Candidate profile not found or not updatable." });
  }
  const auditMeta = JSON.stringify({ decision, reason: reason?.trim() ?? null, at: new Date().toISOString() });
  await sql`
    insert into admin_audit_logs (admin_id, action, target_type, target_id, metadata)
    values (${req.user.sub}, ${`verification_${decision}`}, 'profile', ${profileId}, ${auditMeta})
  `;
  return res.json({ profile: updated[0] });
});

const server = createServer(app);

const host = process.env.HOST ?? "0.0.0.0";

server.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log("Leave this terminal open while you use the app (Ctrl+C to stop).");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${port} is already in use.`);
    console.error(`The API may already be running — try http://localhost:${port}/api/health in your browser.`);
    console.error("If health works, you do not need to start the API again.");
    console.error(
      "Otherwise stop the process on port 3001, then run npm run dev:api again.\n"
    );
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

// Some Windows terminals close stdin immediately; keep the process attached when interactive.
if (process.stdin.isTTY) {
  process.stdin.resume();
}

