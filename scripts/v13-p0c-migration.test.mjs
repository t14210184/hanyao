import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = fs.readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();
assert.equal(files.at(-1), "0011_atomic_terminal_completion.sql");

const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
for (const file of files) {
  db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
}

for (const [table, column] of [
  ["conversion_outbox", "completion_id"],
  ["business_conversions", "completion_id"],
  ["provider_delivery_leases", "completion_id"],
  ["provider_attempt_events", "completion_id"],
]) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
  assert.ok(columns.includes(column), `${table}.${column}`);
}
const indexes = new Set([
  ...db.prepare("PRAGMA index_list(conversion_outbox)").all().map((row) => row.name),
  ...db.prepare("PRAGMA index_list(business_conversions)").all().map((row) => row.name),
  ...db.prepare("PRAGMA index_list(provider_delivery_leases)").all().map((row) => row.name),
  ...db.prepare("PRAGMA index_list(provider_attempt_events)").all().map((row) => row.name),
]);
for (const index of [
  "idx_conversion_outbox_completion_id",
  "idx_business_conversions_completion_id",
  "idx_provider_delivery_leases_completion_id",
  "idx_provider_attempt_events_completion_id",
]) assert.ok(indexes.has(index), index);

console.log(JSON.stringify({
  result: "V13_P0C_MIGRATION_PASS",
  replay: files.map((name) => name.slice(0, 4)).join("->"),
  completionColumns: true,
  completionIndexes: true,
}));
