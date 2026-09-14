import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = fs.readdirSync(migrationsDir)
  .filter((name) => /^(?:000[1-9]|0010)_.*\.sql$/.test(name))
  .sort();

assert.equal(files.at(-1), "0010_provider_transport_recovery.sql");
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
for (const file of files) {
  db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
}

const outboxColumns = db.prepare("PRAGMA table_info(conversion_outbox)").all()
  .map((row) => row.name);
assert.ok(outboxColumns.includes("upload_payload_hash"));

const attemptColumns = db.prepare("PRAGMA table_info(provider_attempts)").all()
  .map((row) => row.name);
assert.ok(attemptColumns.includes("destination_key"));
assert.ok(attemptColumns.includes("payload_hash"));
const attemptIndexes = db.prepare("PRAGMA index_list(provider_attempts)").all()
  .map((row) => row.name);
assert.ok(attemptIndexes.includes("idx_provider_attempts_recovery_context"));

const eventIndexes = db.prepare("PRAGMA index_list(provider_attempt_events)").all()
  .map((row) => row.name);
assert.ok(eventIndexes.includes("idx_provider_attempt_events_ack_restore"));

console.log(JSON.stringify({
  result: "V13_P0B_MIGRATION_PASS",
  replay: files.map((name) => name.slice(0, 4)).join("->"),
  transportRecoveryColumns: true,
  recoveryIndexes: true,
}));
