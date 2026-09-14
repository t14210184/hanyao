import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = fs.readdirSync(migrationsDir)
  .filter((name) => /^000[1-9]_.*\.sql$/.test(name))
  .sort();

assert.equal(files.at(-1), "0009_immutable_lead_attribution_snapshot.sql");
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
for (const file of files) {
  db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
}

const columns = db.prepare("PRAGMA table_info(lead_tokens)").all()
  .map((row) => row.name);
for (const column of [
  "attribution_snapshot_json",
  "attribution_snapshot_hash",
  "lineage_rule_version",
]) assert.ok(columns.includes(column), column);
db.prepare(`INSERT INTO lead_tokens (
  lead_token, request_id, session_id, channel, status, server_created_at
) VALUES (?, ?, NULL, 'line', 'issued', ?)`)
  .run("HY-LEGACY0000", "11111111-1111-4111-8111-111111111111", "2026-09-01T00:00:00.000Z");

const legacy = db.prepare(`SELECT
  attribution_snapshot_json,
  attribution_snapshot_hash,
  lineage_rule_version
FROM lead_tokens WHERE lead_token = ?`).get("HY-LEGACY0000");
assert.equal(legacy.attribution_snapshot_json, null);
assert.equal(legacy.attribution_snapshot_hash, null);
assert.equal(legacy.lineage_rule_version, null);

const indexes = db.prepare("PRAGMA index_list(lead_tokens)").all()
  .map((row) => row.name);
assert.ok(indexes.includes("idx_lead_tokens_lineage_rule"));

console.log(JSON.stringify({
  result: "V13_P0A_MIGRATION_PASS",
  replay: files.map((name) => name.slice(0, 4)).join("->"),
  legacyFailClosed: true,
}));
