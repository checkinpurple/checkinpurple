import { readFileSync, writeFileSync } from "node:fs";

const sqlPath = process.argv[2];
const outDir = process.argv[3] || "/tmp/sqlchunks";
const maxChars = Number(process.argv[4] || 12000);

const sql = readFileSync(sqlPath, "utf8");

// Split into top-level statements, respecting $$-delimited function bodies.
const statements = [];
let buf = "";
let inDollar = false;
for (let i = 0; i < sql.length; i++) {
  const ch = sql[i];
  const two = sql.slice(i, i + 2);
  if (two === "$$") {
    inDollar = !inDollar;
    buf += two;
    i++;
    continue;
  }
  buf += ch;
  if (ch === ";" && !inDollar) {
    statements.push(buf.trim());
    buf = "";
  }
}
if (buf.trim()) statements.push(buf.trim());

// Group statements into chunks under maxChars.
const chunks = [];
let cur = "";
for (const st of statements) {
  if (cur && cur.length + st.length + 2 > maxChars) {
    chunks.push(cur);
    cur = "";
  }
  cur += (cur ? "\n\n" : "") + st;
}
if (cur) chunks.push(cur);

import("node:fs").then(({ mkdirSync }) => {
  mkdirSync(outDir, { recursive: true });
  chunks.forEach((c, idx) => {
    const p = `${outDir}/chunk_${String(idx + 1).padStart(2, "0")}.sql`;
    writeFileSync(p, c);
    console.log(`${p}\t${c.length} chars`);
  });
  console.log(`TOTAL chunks: ${chunks.length}, statements: ${statements.length}`);
});
