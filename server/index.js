import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:8080";
const jwtSecret = process.env.JWT_SECRET ?? "replace-this-in-production";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables.");
}

const sql = neon(databaseUrl);
const upload = multer({ storage: multer.memoryStorage() });
const uploadsDir = path.resolve(process.cwd(), "server", "uploads");

app.use(cors({ origin: frontendOrigin, credentials: false }));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(uploadsDir));

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

  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    insert into profiles (email, password_hash, first_name, surname, id_number)
    values (${email}, ${passwordHash}, ${first_name ?? null}, ${surname ?? null}, ${id_number ?? null})
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
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login payload." });
  }
  const { email, password } = parsed.data;
  const rows = await sql`
    select id, email, role, password_hash
    from profiles
    where email = ${email}
    limit 1
  `;
  if (!rows.length) {
    return res.status(401).json({ message: "Invalid credentials." });
  }
  const profile = rows[0];
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
});

app.post("/api/auth/logout", (_req, res) => {
  return res.status(204).send();
});

app.get("/api/profile/me", authMiddleware, async (req, res) => {
  const profileId = req.user.sub;
  const rows = await sql`
    select id, email, first_name, surname, id_number, licence_code, role, verification_status, eye_test_status, payment_status
    from profiles
    where id = ${profileId}
    limit 1
  `;
  if (!rows.length) {
    return res.status(404).json({ message: "Profile not found." });
  }
  return res.json(rows[0]);
});

app.post(
  "/api/verification/submit",
  authMiddleware,
  upload.fields([
    { name: "idCopy", maxCount: 1 },
    { name: "passportCopy", maxCount: 1 },
  ]),
  async (req, res) => {
    const profileId = req.user.sub;
    const { firstName, surname, idNumber, licenceCode, faceCaptureBase64 } = req.body;

    const files = req.files ?? {};
    const idCopy = files.idCopy?.[0] ?? null;
    const passportCopy = files.passportCopy?.[0] ?? null;

    let idPath = null;
    let passportPath = null;
    let facePath = null;

    if (idCopy) {
      idPath = await persistBuffer(`verification/${profileId}`, `id-${Date.now()}-${idCopy.originalname}`, idCopy.buffer);
    }
    if (passportCopy) {
      passportPath = await persistBuffer(
        `verification/${profileId}`,
        `passport-${Date.now()}-${passportCopy.originalname}`,
        passportCopy.buffer
      );
    }
    if (faceCaptureBase64?.startsWith("data:image")) {
      const buffer = Buffer.from(faceCaptureBase64.split(",")[1] ?? "", "base64");
      facePath = await persistBuffer(`verification/${profileId}`, `face-${Date.now()}.png`, buffer);
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
      insert into verification_documents (profile_id, id_copy_path, passport_copy_path, face_capture_path, review_status)
      values (${profileId}, ${idPath}, ${passportPath}, ${facePath}, 'pending')
    `;

    return res.status(201).json({ message: "Verification submitted." });
  }
);

app.post("/api/eye-test/submit", authMiddleware, upload.single("doctorLetter"), async (req, res) => {
  const profileId = req.user.sub;
  const status = req.body.status;
  if (!["passed", "uploaded"].includes(status)) {
    return res.status(400).json({ message: "Invalid eye test status." });
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
    paid: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid booking payload." });
  }
  const profileId = req.user.sub;
  const { bookingDate, slotTime, paid } = parsed.data;

  await sql`
    insert into bookings (profile_id, booking_date, slot_time, status)
    values (${profileId}, ${bookingDate}, ${slotTime}, 'confirmed')
  `;

  if (paid) {
    await sql`
      update profiles
      set payment_status = 'paid', updated_at = now()
      where id = ${profileId}
    `;
  }

  return res.status(201).json({ message: "Booking created." });
});

app.get("/api/questions/active", authMiddleware, async (_req, res) => {
  const rows = await sql`
    select question_text, options_json, correct_answer
    from question_bank
    where is_active = true
    order by created_at asc
    limit 70
  `;

  if (!rows.length) {
    return res.json([
      {
        question: "What does a red traffic light mean?",
        options: [
          { id: "A", text: "Proceed with caution" },
          { id: "B", text: "Stop" },
          { id: "C", text: "Speed up" },
          { id: "D", text: "Pedestrians only" },
        ],
        correctAnswer: "B",
      },
    ]);
  }

  return res.json(
    rows.map((row) => ({
      question: row.question_text,
      options: row.options_json,
      correctAnswer: row.correct_answer,
    }))
  );
});

app.post("/api/attempts/mark", authMiddleware, async (req, res) => {
  const schema = z.object({
    answers: z.record(z.string()),
    total: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid marking payload." });
  }

  const { answers, total } = parsed.data;
  const rows = await sql`
    select correct_answer
    from question_bank
    where is_active = true
    order by created_at asc
    limit ${total}
  `;

  let score = 0;
  rows.forEach((row, index) => {
    const key = String(index);
    if (answers[key] === row.correct_answer) {
      score += 1;
    }
  });
  const percentage = (score / total) * 100;
  return res.json({ score, percentage, passed: percentage >= 80 });
});

app.post("/api/attempts", authMiddleware, async (req, res) => {
  const schema = z.object({
    score: z.number().int().min(0),
    total: z.number().int().positive(),
    percentage: z.number(),
    passed: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid attempt payload." });
  }
  const profileId = req.user.sub;
  const { score, total, percentage, passed } = parsed.data;
  await sql`
    insert into attempts (profile_id, score, total, percentage, passed)
    values (${profileId}, ${score}, ${total}, ${percentage}, ${passed})
  `;
  return res.status(201).json({ message: "Attempt saved." });
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

app.listen(port, () => {
  console.log(`Neon API listening on http://localhost:${port}`);
});

