import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = fs.readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();

assert.equal(files.at(-1), "0015_v11_observability_hardening.sql");
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
for (const table of [
  "lead_signal_observations",
  "lead_user_identifiers",
  "message_asset_metrics_daily",
  "conversion_user_data_snapshots",
  "conversion_user_data_snapshot_items",
]) {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(table);
  assert.equal(row?.name, table);
}

console.log(JSON.stringify({
  result: "V13_P1_M03_MIGRATION_PASS",
  replay: files.map((name) => name.slice(0, 4)).join("->"),
  outboxWarningEvidence: true,
  attemptWarningEvidence: true,
  highIntentShadowSchema: true,
  enhancedUserDataSnapshotSchema: true,
}));
