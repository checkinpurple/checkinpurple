import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node run-schema.mjs <path-to-sql>");
  process.exit(1);
}

let connectionString =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING / POSTGRES_URL");
  process.exit(1);
}

// Extract host for SNI (Supavisor routes the tenant by TLS SNI), then strip
// sslmode so our explicit ssl options take effect instead of verify-full.
const hostMatch = connectionString.match(/@([^:/?]+)/);
const servername = hostMatch ? hostMatch[1] : undefined;
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, "");

const sql = readFileSync(sqlPath, "utf8");

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false, servername },
});

try {
  await client.connect();
  console.log("[schema] connected, executing...");
  await client.query(sql);
  console.log("[schema] executed successfully");
} catch (err) {
  console.error("[schema] ERROR:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
