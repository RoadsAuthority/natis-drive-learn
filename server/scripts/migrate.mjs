/**
 * Applies SQL migrations from neon/migrations/ to your Neon database.
 * Uses DATABASE_URL from server/.env (repo root when run via npm).
 *
 * Usage:
 *   npm run db:migrate
 */
import { readFileSync, readdirSync } from "node:fs";
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

const migrationsDir = path.resolve(process.cwd(), "neon", "migrations");
const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

/** Split on statement boundaries; migrations have no semicolons inside string literals. */
function splitSqlStatements(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

const sql = neon(databaseUrl);
let totalStatements = 0;

for (const migrationFile of migrationFiles) {
  const migrationPath = path.join(migrationsDir, migrationFile);
  const raw = readFileSync(migrationPath, "utf8");
  const statements = splitSqlStatements(raw);
  console.log(`\nApplying ${migrationFile} (${statements.length} statement(s))…`);

  let n = 0;
  for (const statement of statements) {
    const text = statement.endsWith(";") ? statement : `${statement};`;
    await sql.unsafe(text);
    n += 1;
    totalStatements += 1;
    const preview = statement.split("\n")[0]?.slice(0, 60) ?? "";
    console.log(`OK (${n}/${statements.length}): ${preview}…`);
  }
}

console.log(`\nMigration finished: ${totalStatements} statement(s) across ${migrationFiles.length} file(s).`);
