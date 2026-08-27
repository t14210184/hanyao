import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const workerDir = join(cwd, "workers", "google-ads-uploader");
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const files = walk(workerDir).filter((path) => !path.includes("/node_modules/"));
const sourceFiles = files.filter((path) => path.endsWith(".ts") || path.endsWith(".jsonc"));
const source = sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const testFiles = files.filter((path) => path.includes("/test/") && path.endsWith(".ts"));
const tests = testFiles.map((path) => readFileSync(path, "utf8")).join("\n");

assert.equal(source.includes("wrangler deploy"), false);
assert.equal(source.includes("wrangler pages deploy"), false);
assert.equal(source.includes("remote\\\": true"), false);
assert.equal(source.includes("/api/"), false);
assert.equal(source.includes("LINE_CHANNEL_SECRET"), false);
assert.equal(source.includes("CF_API_TOKEN"), false);
assert.equal(source.includes("GOOGLE_DATA_MANAGER_EVENTS_URL"), true);
assert.equal(source.includes("scheduled("), true);
assert.equal(tests.includes("GOOGLE_DATA_MANAGER_EVENTS_URL"), true);
assert.equal(tests.includes("fetch(`http"), false);
assert.equal(tests.includes("-----BEGIN PRIVATE KEY-----"), false);
assert.equal(tests.includes("-----BEGIN RSA PRIVATE KEY-----"), false);
assert.equal(tests.includes("ya29."), false);

const config = JSON.parse(readFileSync(join(workerDir, "wrangler.jsonc"), "utf8"));
assert.equal(config.d1_databases[0].database_name, "hanyao-attribution-local-only");
assert.equal(config.d1_databases[0].preview_database_id, "google-ads-uploader-local");
assert.equal("remote" in config.d1_databases[0], false);
assert.equal(config.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "true");

console.log(JSON.stringify({
  result: "LINE4A_STATIC_PASS",
  realGoogleCalls: false,
  cloudflareMutation: false,
  credentialFixtures: false,
}));
