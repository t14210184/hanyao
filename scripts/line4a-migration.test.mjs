import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = [
  join(cwd, "node_modules/.bin/wrangler"),
  join(cwd, "..", "repo", "node_modules/.bin/wrangler"),
  join(cwd, "..", "..", "node_modules/.bin/wrangler"),
].find((path) => existsSync(path));
if (!wrangler) throw new Error("WRANGLER_LOCAL_BINARY_NOT_FOUND");
const sourceMigrations = join(cwd, "migrations");
const names = ["attribution_v1", "attribution_retention_integrity", "line_webhook_foundation", "google_uploader_state"];

const run = (args) => {
  const result = spawnSync(wrangler, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_D1_WARNING: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(`Wrangler failed: ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

const makeRoot = (migrationCount) => {
  const root = mkdtempSync(join(tmpdir(), "line4a-migration-"));
  const migrationDir = join(root, "migrations");
  mkdirSync(migrationDir, { recursive: true });
  for (let index = 1; index <= migrationCount; index += 1) {
    const name = `${String(index).padStart(4, "0")}_${names[index - 1]}.sql`;
    copyFileSync(join(sourceMigrations, name), join(migrationDir, name));
  }
  const configPath = join(root, "wrangler.jsonc");
  writeFileSync(configPath, JSON.stringify({
    name: `line4a-local-${process.pid}-${Date.now()}`,
    compatibility_date: "2026-08-27",
    d1_databases: [{
      binding: "ATTRIBUTION_DB",
      database_name: "line4a-local-only",
      database_id: "00000000-0000-0000-0000-000000000004",
      preview_database_id: "line4a-local-db",
      migrations_dir: "./migrations",
    }],
  }, null, 2));
  return { root, configPath, persistTo: join(root, ".state") };
};

const apply = (fixture) => run([
  "d1", "migrations", "apply", "ATTRIBUTION_DB", "--local",
  "--persist-to", fixture.persistTo, "--config", fixture.configPath,
]);

const execute = (fixture, command) => JSON.parse(run([
  "d1", "execute", "ATTRIBUTION_DB", "--local", "--persist-to", fixture.persistTo,
  "--config", fixture.configPath, "--json", "--command", command,
]));

const fresh = makeRoot(4);
apply(fresh);
const freshSchema = execute(fresh, "PRAGMA table_info(conversion_outbox); SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_conversion_outbox_%' ORDER BY name;");
const freshColumns = freshSchema[0].results.map((row) => row.name);
assert.deepEqual(freshColumns.slice(-10), [
  "submitted_at", "google_request_id", "next_diagnostic_at", "terminal_result",
  "last_error_reason", "diagnostic_status", "diagnostic_record_count",
  "diagnostic_error_reason", "diagnostic_attempt_count", "updated_at",
]);
assert.deepEqual(freshSchema[1].results.map((row) => row.name), [
  "idx_conversion_outbox_diagnostic_due", "idx_conversion_outbox_google_request_id",
  "idx_conversion_outbox_lead_token", "idx_conversion_outbox_next_retry_at",
  "idx_conversion_outbox_status", "idx_conversion_outbox_status_next_retry",
]);

const upgrade = makeRoot(3);
apply(upgrade);
execute(upgrade, "INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at) VALUES ('session-upgrade', 1, '2026-08-28T00:00:00.000Z', '2026-08-28T00:00:00.000Z', '2026-11-26T00:00:00.000Z'); INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES ('HY-UPGRADE01', 'request-upgrade', 'session-upgrade', 'line', 'issued', '2026-08-28T00:00:00.000Z'); INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, gclid, attribution_touch, transaction_id, destination_key, status, retry_count, created_at) VALUES ('conversion-upgrade', 'HY-UPGRADE01', 'verified_line_contact', '2026-08-27T00:00:00.000Z', 'stored-gclid', 'last', 'stable-upgrade-transaction', 'HY_VERIFIED_LINE_CONTACT', 'pending', 0, '2026-08-28T00:00:00.000Z');");
copyFileSync(join(sourceMigrations, "0004_google_uploader_state.sql"), join(upgrade.root, "migrations", "0004_google_uploader_state.sql"));
apply(upgrade);
const upgraded = execute(upgrade, "SELECT conversion_id, transaction_id, status, retry_count, updated_at, submitted_at, google_request_id, diagnostic_attempt_count FROM conversion_outbox WHERE conversion_id='conversion-upgrade'; PRAGMA foreign_key_check;");
assert.deepEqual(upgraded[0].results, [{
  conversion_id: "conversion-upgrade",
  transaction_id: "stable-upgrade-transaction",
  status: "pending",
  retry_count: 0,
  updated_at: "2026-08-28T00:00:00.000Z",
  submitted_at: null,
  google_request_id: null,
  diagnostic_attempt_count: 0,
}]);
assert.deepEqual(upgraded[1].results, []);

console.log(JSON.stringify({
  result: "LINE4A_MIGRATION_PASS",
  freshDatabase: "0001->0002->0003->0004",
  upgradeDatabase: "existing 0003 data preserved through 0004",
  remoteMutation: false,
}));
