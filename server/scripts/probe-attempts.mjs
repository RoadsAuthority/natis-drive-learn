import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(serverDir, ".env") });

const sql = neon(process.env.DATABASE_URL);

try {
  const cols = await sql`
    select column_name
    from information_schema.columns
    where table_name = 'attempts'
    order by ordinal_position
  `;
  console.log("attempts columns:", cols.map((c) => c.column_name).join(", "));

  const rows = await sql`
    select a.id, a.score, a.total, a.percentage, a.passed, a.review_flagged, a.suspicion_score, a.created_at, p.email
    from attempts a
    join profiles p on p.id = a.profile_id
    order by a.created_at desc
    limit 5
  `;
  console.log("admin attempts query ok, rows:", rows.length, JSON.stringify(rows, null, 2));
} catch (error) {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
}
