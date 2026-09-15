import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = fs.readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();

assert.equal(files.at(-1), "0012_provider_quality_evidence.sql");
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
for (const file of files) {
  db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
}

const columns = (table) => new Set(
  db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name)
);
assert.ok(columns("conversion_outbox").has("provider_warning_json"));
assert.ok(columns("provider_attempt_events").has("provider_warning_json"));

console.log(JSON.stringify({
  result: "V13_P1_M03_MIGRATION_PASS",
  replay: files.map((name) => name.slice(0, 4)).join("->"),
  outboxWarningEvidence: true,
  attemptWarningEvidence: true,
}));
