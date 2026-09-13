import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PLACEHOLDER = "C1B1_LOCAL_ONLY_NO_PRODUCTION_ID";
const EXPECTED_PREVIEW_D1_ID = "78ada4dd-4bcd-4b2d-8a37-aae6207f457a";
const EXPECTED_PREVIEW_D1_NAME = "hanyao-attribution-preview";
const EXPECTED_PRODUCTION_D1_ID = "52453bad-90a3-4495-911b-c3d5b6cefb1f";
const EXPECTED_PRODUCTION_D1_NAME = "hanyao-attribution-production";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_KEY_PATTERN = /(secret|token|password|api[_-]?key)/i;
const args = process.argv.slice(2);
const remoteMode = args.includes("--remote");
const localMode = args.includes("--local");
const configIndex = args.indexOf("--config");
const configPath = resolve(
  configIndex >= 0 && args[configIndex + 1]
    ? args[configIndex + 1]
    : "wrangler.jsonc"
);

if (!existsSync(configPath)) {
  console.error(`CONFIG_SAFETY_FAIL: config not found: ${configPath}`);
  process.exit(1);
}

const configText = readFileSync(configPath, "utf8");
if (remoteMode && configText.includes(PLACEHOLDER)) {
  console.error("CONFIG_SAFETY_FAIL: local placeholder present in remote config");
  process.exit(1);
}

if (!remoteMode && configText.includes(PLACEHOLDER)) {
  if (!localMode) {
    console.error(
      "CONFIG_SAFETY_FAIL: local placeholder requires explicit --local mode"
    );
    process.exit(1);
  }
  console.log(`CONFIG_SAFETY_PASS: ${configPath}`);
  process.exit(0);
}

if (remoteMode) {
  const remoteDatabaseId = process.env.C1B1_REMOTE_D1_DATABASE_ID ?? "";
  if (!UUID_PATTERN.test(remoteDatabaseId)) {
    console.error(
      "CONFIG_SAFETY_FAIL: remote deploy requires C1B1_REMOTE_D1_DATABASE_ID as a real D1 UUID"
    );
    process.exit(1);
  }
  if (!configText.includes("ATTRIBUTION_DB")) {
    console.error("CONFIG_SAFETY_FAIL: remote config has no ATTRIBUTION_DB binding");
    process.exit(1);
  }

  console.log("CONFIG_SAFETY_PASS: explicit remote D1 id and binding supplied");
  process.exit(0);
}

let config;
try {
  config = JSON.parse(configText);
} catch (error) {
  console.error(
    `CONFIG_SAFETY_FAIL: wrangler.jsonc must be valid JSONC/JSON for this tracked policy: ${error.message}`
  );
  process.exit(1);
}

const fail = (message) => {
  console.error(`CONFIG_SAFETY_FAIL: ${message}`);
  process.exit(1);
};

const secretValuePaths = [];
const databaseIdPaths = [];
const walk = (value, path) => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (SECRET_KEY_PATTERN.test(key) && typeof child === "string" && child.trim()) {
      secretValuePaths.push(childPath);
    }
    if (key === "database_id" && typeof child === "string" && UUID_PATTERN.test(child)) {
      databaseIdPaths.push({ path: childPath, value: child });
    }
    if (key === "preview_database_id") {
      fail(`preview_database_id is not allowed: ${childPath}`);
    }
    walk(child, childPath);
  }
};
walk(config, "$config");

if (secretValuePaths.length > 0) {
  fail(`secret-like config value is not allowed: ${secretValuePaths.join(", ")}`);
}
const productionDatabases = config?.d1_databases;
if (!Array.isArray(productionDatabases) || productionDatabases.length !== 1) {
  fail("top-level d1_databases must contain exactly one Production D1 binding");
}
const [productionDatabase] = productionDatabases;
if (productionDatabase.binding !== "ATTRIBUTION_DB") {
  fail("Production binding must be ATTRIBUTION_DB");
}
if (productionDatabase.database_id !== EXPECTED_PRODUCTION_D1_ID) {
  fail(`Production database_id must be ${EXPECTED_PRODUCTION_D1_ID}`);
}
if (productionDatabase.database_name !== EXPECTED_PRODUCTION_D1_NAME) {
  fail(`Production database_name must be ${EXPECTED_PRODUCTION_D1_NAME}`);
}

const previewDatabases = config?.env?.preview?.d1_databases;
if (!Array.isArray(previewDatabases) || previewDatabases.length !== 1) {
  fail("env.preview.d1_databases must contain exactly one Preview D1 binding");
}

const [previewDatabase] = previewDatabases;
if (previewDatabase.binding !== "ATTRIBUTION_DB") {
  fail("Preview binding must be ATTRIBUTION_DB");
}
if (previewDatabase.database_id !== EXPECTED_PREVIEW_D1_ID) {
  fail(`Preview database_id must be ${EXPECTED_PREVIEW_D1_ID}`);
}
if (previewDatabase.database_name !== EXPECTED_PREVIEW_D1_NAME) {
  fail(`Preview database_name must be ${EXPECTED_PREVIEW_D1_NAME}`);
}
if (previewDatabase.migrations_dir !== "./migrations") {
  fail("Preview migrations_dir must be ./migrations");
}

for (const [environment, environmentConfig] of Object.entries(config?.env ?? {})) {
  if (environment === "preview") continue;
  if (Array.isArray(environmentConfig?.d1_databases) && environmentConfig.d1_databases.length > 0) {
    fail(`D1 bindings are forbidden outside env.preview: env.${environment}`);
  }
}

const allowedDatabaseIds = new Map([
  ["$config.d1_databases.0.database_id", EXPECTED_PRODUCTION_D1_ID],
  ["$config.env.preview.d1_databases.0.database_id", EXPECTED_PREVIEW_D1_ID],
]);
for (const { path, value } of databaseIdPaths) {
  if (allowedDatabaseIds.get(path) !== value) {
    fail(`unknown or misplaced D1 UUID: ${path}`);
  }
}
if (databaseIdPaths.length !== allowedDatabaseIds.size) {
  fail("exactly the known Production and Preview D1 UUIDs must be present");
}

console.log(`CONFIG_SAFETY_PASS: ${configPath}`);
