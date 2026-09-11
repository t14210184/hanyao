import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const configText = readFileSync(
  join(root, "workers", "google-ads-uploader", "wrangler.jsonc"),
  "utf8"
);
const config = JSON.parse(configText);
const production = config.env?.production;
assert.ok(production, "production environment must exist");

assert.equal(config.vars.UPLOADER_ENVIRONMENT, "preview");
assert.equal(config.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "true");

assert.deepEqual(production.triggers?.crons, ["*/5 * * * *"]);
assert.equal(production.vars.UPLOADER_ENVIRONMENT, "production");
assert.equal(production.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "false");
assert.equal(production.vars.GOOGLE_ADS_ACCOUNT_ID, "4801404246");
assert.equal(production.vars.GOOGLE_ADS_CONVERSION_ACTION_ID, "7674301565");
assert.equal(production.vars.GOOGLE_OUTBOX_TERMINAL_RETENTION_DAYS, "90");
assert.equal("PRODUCTION_HUMAN_GATE" in production.vars, false);
assert.deepEqual(
  [...production.secrets.required].sort(),
  ["GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON", "PRODUCTION_HUMAN_GATE"].sort()
);

const d1 = production.d1_databases?.[0];
assert.equal(d1.binding, "ATTRIBUTION_DB");
assert.equal(d1.database_name, "hanyao-attribution-production");
assert.equal(d1.database_id, "52453bad-90a3-4495-911b-c3d5b6cefb1f");
assert.equal(d1.migrations_dir, "../../migrations");
assert.equal(configText.includes("HUMAN_GATE_CONFIRMED"), false);
assert.equal(configText.includes("-----BEGIN PRIVATE KEY-----"), false);

console.log(
  JSON.stringify({
    result: "LINE4C_PRODUCTION_ACTIVATION_CONFIG_PASS",
    productionCron: "*/5 * * * *",
    validateOnly: false,
    exactProductionD1: true,
    secretsCommitted: false,
  })
);
