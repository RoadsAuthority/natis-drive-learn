import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(serverDir, ".env") });

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `alter table attempts
    add column if not exists review_flagged boolean not null default false`,
  `alter table attempts
    add column if not exists suspicion_score integer not null default 0`,
  `alter table attempts
    add column if not exists proctoring_summary jsonb not null default '{}'::jsonb`,
  `alter table profiles
    add column if not exists next_test_eligible_at timestamptz`,
  `alter table profiles
    add column if not exists next_booking_eligible_at timestamptz`,
  `alter table profiles
    add column if not exists license_collection_from timestamptz`,
];

for (const statement of statements) {
  console.log("Running:", statement.split("\n")[0], "...");
  await sql.query(statement);
  console.log("OK");
}

const cols = await sql`
  select column_name
  from information_schema.columns
  where table_schema = 'public' and table_name = 'attempts'
  order by ordinal_position
`;
console.log("\nattempts columns:", cols.map((c) => c.column_name).join(", "));
