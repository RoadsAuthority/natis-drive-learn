/**
 * Loads multiple-choice questions from data/question-bank.json into Neon (question_bank).
 *
 * Usage:
 *   npm run seed:questions
 *   npm run seed:questions -- --replace   (deletes all rows in question_bank first)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL in server/.env");
  process.exit(1);
}

const replace = process.argv.includes("--replace");
const jsonPath = path.resolve(process.cwd(), "data", "question-bank.json");
const raw = readFileSync(jsonPath, "utf8");
const questions = JSON.parse(raw);

if (!Array.isArray(questions) || questions.length === 0) {
  console.error("data/question-bank.json must be a non-empty JSON array.");
  process.exit(1);
}

for (const q of questions) {
  if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
    console.error("Each item needs question, options[], correctAnswer");
    process.exit(1);
  }
}

const sql = neon(databaseUrl);

if (replace) {
  await sql`delete from question_bank`;
  console.log("Cleared question_bank (--replace).");
}

for (const q of questions) {
  const correct = String(q.correctAnswer).toLowerCase();
  const imageUrl = q.imageUrl ?? q.image_url ?? null;
  await sql`
    insert into question_bank (question_text, options_json, correct_answer, image_url, is_active)
    values (${q.question}, ${JSON.stringify(q.options)}, ${correct}, ${imageUrl}, true)
  `;
}

console.log(`Inserted ${questions.length} question(s).`);
