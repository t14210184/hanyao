import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const workerDir = join(cwd, "workers", "google-ads-uploader");
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const files = walk(workerDir).filter((path) => !/[\\/]node_modules[\\/]/.test(path));
const sourceFiles = files.filter((path) => path.endsWith(".ts") || path.endsWith(".jsonc"));
const source = sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const testFiles = files.filter((path) => /[\\/]test[\\/]/.test(path) && path.endsWith(".ts"));
const tests = testFiles.map((path) => readFileSync(path, "utf8")).join("\n");

assert.equal(source.includes("wrangler deploy"), false);
assert.equal(source.includes("wrangler pages deploy"), false);
assert.equal(source.includes("remote\\\": true"), false);
assert.equal(source.includes("/api/"), false);
assert.equal(source.includes("LINE_CHANNEL_SECRET"), false);
assert.equal(source.includes("CF_API_TOKEN"), false);
const oldRetentionPolicyKey = ["GOOGLE_OUTBOX_TERMINAL_RETENTION_CUTOFF", "ISO"].join("_");
assert.equal(source.includes(oldRetentionPolicyKey), false);
assert.equal(source.includes("GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS"), true);
assert.equal(source.includes("GOOGLE_DATA_MANAGER_EVENTS_URL"), true);
assert.equal(source.includes("scheduled("), true);
assert.equal(tests.includes("GOOGLE_DATA_MANAGER_EVENTS_URL"), true);
for (const required of [
  "business_conversion_id",
  "lease_generation",
  "lease_owner",
  "RECONCILIATION_REQUIRED",
  "provider_attempts",
]) {
  assert.equal(source.includes(required), true, `missing v1.2 contract: ${required}`);
}
assert.equal(tests.includes("stale lease owner cannot overwrite a newer nonterminal outbox state"), true);
assert.equal(tests.includes("provider receipt save failure is not converted into a second provider failure write"), true);
for (const required of [
  "completion_id",
  "terminal_completion_guard",
  "terminal_completion_verified",
  "RESULT_UNKNOWN",
  "ACK_RESTORED_AFTER_STALE_CLAIM",
]) {
  assert.equal(source.includes(required), true, `missing v1.3 hardening contract: ${required}`);
}
assert.equal(tests.includes("fetch(`http"), false);
assert.equal(tests.includes("-----BEGIN PRIVATE KEY-----"), false);
assert.equal(tests.includes("-----BEGIN RSA PRIVATE KEY-----"), false);
assert.equal(tests.includes("ya29."), false);

const config = JSON.parse(readFileSync(join(workerDir, "wrangler.jsonc"), "utf8"));
assert.equal(config.d1_databases[0].database_name, "hanyao-attribution-local-only");
assert.equal(config.d1_databases[0].preview_database_id, "google-ads-uploader-local");
assert.equal("remote" in config.d1_databases[0], false);
assert.equal(config.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "true");
assert.equal(config.vars.GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS, "90");
assert.equal(config.vars.MESSAGE_ASSET_METRICS_ENABLED, "false");
assert.equal(config.vars.MESSAGE_ASSET_METRICS_MIN_INTERVAL_MINUTES, "60");\nassert.equal(config.vars.GOOGLE_ENHANCED_CONVERSIONS_USER_DATA_ENABLED, "false");\nassert.equal(config.vars.GOOGLE_ENHANCED_CONVERSIONS_AD_USER_DATA_CONSENT, "UNSPECIFIED");

console.log(JSON.stringify({
  result: "LINE4A_STATIC_PASS",
  realGoogleCalls: false,
  cloudflareMutation: false,
  credentialFixtures: false,
}));
