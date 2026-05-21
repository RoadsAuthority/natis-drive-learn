import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(serverDir, ".env") });

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  select email, role, password_hash is null as missing_hash, length(password_hash) as hash_len
  from profiles
  order by created_at desc
  limit 20
`;
console.log(JSON.stringify(rows, null, 2));
