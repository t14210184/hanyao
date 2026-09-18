import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { auditTopology } from "./hg09-single-writer-topology-audit.mjs";

const root = process.cwd();
const config = JSON.parse(
  readFileSync(join(root, "workers", "google-ads-uploader", "wrangler.jsonc"), "utf8")
);
const production = config.env?.production;
const productionCron = ["*/5 * * * *"];

assert.equal(config.triggers?.crons?.length ?? 0, 0);
assert.equal(config.vars.UPLOADER_ENVIRONMENT, "preview");
assert.equal(config.vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "true");
assert.equal(config.d1_databases?.[0]?.database_name, "hanyao-attribution-local-only");
assert.notEqual(config.d1_databases?.[0]?.database_name, "hanyao-attribution-production");
assert.deepEqual(production?.triggers?.crons, productionCron);
assert.equal(production?.vars?.UPLOADER_ENVIRONMENT, "production");
assert.equal(production?.vars?.GOOGLE_DATA_MANAGER_VALIDATE_ONLY, "false");
assert.equal(production?.vars?.GOOGLE_ADS_ACCOUNT_ID, "4801404246");
assert.equal(production?.vars?.GOOGLE_ADS_CONVERSION_ACTION_ID, "7674301565");
assert.equal(production?.d1_databases?.[0]?.database_name, "hanyao-attribution-production");
assert.equal(production?.d1_databases?.[0]?.database_id, "52453bad-90a3-4495-911b-c3d5b6cefb1f");
assert.equal(production?.name ?? config.name + "-production", "google-ads-uploader-production");

const canonical = {
  name: "google-ads-uploader-production",
  schedules: productionCron,
  active: {
    trafficPercent: 100,
    handlers: ["scheduled"],
    d1BindingIds: ["production-d1"],
    vars: {
      UPLOADER_ENVIRONMENT: "production",
      GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
      GOOGLE_ADS_ACCOUNT_ID: "4801404246",
      GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
    },
  },
};
const legacy = {
  name: "google-ads-uploader",
  schedules: productionCron,
  active: {
    trafficPercent: 100,
    handlers: ["scheduled"],
    d1BindingIds: ["production-d1"],
    vars: {
      UPLOADER_ENVIRONMENT: "production",
      GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "false",
      GOOGLE_ADS_ACCOUNT_ID: "4801404246",
      GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
      GOOGLE_DELIVERY_ENABLED: "true",
    },
  },
};
const preview = {
  name: "google-ads-uploader",
  schedules: productionCron,
  active: {
    trafficPercent: 100,
    handlers: ["scheduled"],
    d1BindingIds: ["preview-d1"],
    vars: {
      UPLOADER_ENVIRONMENT: "preview",
      GOOGLE_DATA_MANAGER_VALIDATE_ONLY: "true",
      GOOGLE_ADS_ACCOUNT_ID: "4801404246",
      GOOGLE_ADS_CONVERSION_ACTION_ID: "7674301565",
    },
  },
};

assert.deepEqual(
  auditTopology({ workers: [canonical] }, "production-d1", "4801404246", "7674301565"),
  {
    result: "HG09_TOPOLOGY_AUDIT_PASS",
    scheduledRealDeliveryWorkerCount: 1,
    onlyWriter: "google-ads-uploader-production",
    scheduledRealDeliveryWorkers: ["google-ads-uploader-production"],
    boundedWorkerInventoryCount: 1,
  }
);
assert.equal(
  auditTopology(
    { workers: [canonical, legacy] },
    "production-d1",
    "4801404246",
    "7674301565"
  ).result,
  "HG09_TOPOLOGY_AUDIT_FAIL"
);
assert.equal(
  auditTopology(
    { workers: [preview] },
    "production-d1",
    "4801404246",
    "7674301565"
  ).scheduledRealDeliveryWorkerCount,
  0
);

console.log(
  JSON.stringify({
    result: "HG09_SINGLE_WRITER_CONFIG_AND_TOPOLOGY_TEST_PASS",
    defaultCronCount: config.triggers?.crons?.length ?? 0,
    productionCron: production?.triggers?.crons,
    fixtureMutation: false,
    providerMutation: false,
  })
);
