import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const rootConfig = JSON.parse(readFileSync(join(cwd, "wrangler.jsonc"), "utf8"));
const workerConfigPath = join(
  cwd,
  "workers",
  "google-ads-uploader",
  "wrangler.jsonc"
);
const workerConfigText = readFileSync(workerConfigPath, "utf8");
const workerConfig = JSON.parse(workerConfigText);

const production = workerConfig.env?.production;
assert.ok(production, "production environment must exist");

assert.equal(workerConfig.vars.UPLOADER_ENVIRONMENT, "preview");
assert.equal(workerConfig.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "true");
assert.equal(workerConfig.d1_databases[0].database_name, "hanyao-attribution-local-only");

assert.equal(production.vars.UPLOADER_ENVIRONMENT, "production");
assert.equal(production.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "false");
assert.equal(production.vars.GOOGLE_ADS_ACCOUNT_ID, "4801404246");
assert.equal(production.vars.GOOGLE_ADS_CONVERSION_ACTION_ID, "7674301565");
assert.equal(production.vars.GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS, "90");
assert.equal("PRODUCTION_HUMAN_GATE" in production.vars, false);

const crons = production.triggers?.crons;
const disarmed = Array.isArray(crons) && crons.length === 0;
const armed = Array.isArray(crons) && crons.length === 1 && crons[0] === "*/5 * * * *";
assert.ok(disarmed || armed, "Production cron must be either disarmed [] or the exact five-minute schedule");

assert.deepEqual(
  [...production.secrets.required].sort(),
  ["GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON", "PRODUCTION_HUMAN_GATE"].sort()
);

const productionDb = production.d1_databases?.[0];
const pagesProductionDb = rootConfig.d1_databases?.[0];
assert.equal(productionDb.binding, "ATTRIBUTION_DB");
assert.equal(productionDb.database_name, "hanyao-attribution-production");
assert.equal(productionDb.database_id, "52453bad-90a3-4495-911b-c3d5b6cefb1f");
assert.equal(productionDb.migrations_dir, "../../migrations");
assert.equal(productionDb.database_name, pagesProductionDb.database_name);
assert.equal(productionDb.database_id, pagesProductionDb.database_id);
assert.equal("remote" in productionDb, false);

assert.equal(workerConfigText.includes("HUMAN_GATE_CONFIRMED"), false);
assert.equal(workerConfigText.includes("-----BEGIN PRIVATE KEY-----"), false);
assert.equal(workerConfigText.includes("CLOUDFLARE_API_TOKEN"), false);

console.log(
  JSON.stringify({
    result: "LINE4B_PRODUCTION_CONFIG_PASS",
    productionCronState: armed ? "ARMED" : "DISARMED",
    productionD1Pinned: true,
    requiredSecretsDeclared: true,
    humanGateCommitted: false,
  })
);
