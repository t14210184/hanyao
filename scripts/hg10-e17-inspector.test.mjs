import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const run = async (d1, ads) => {
  const root = await mkdtemp(join(tmpdir(), "hg10-e17-"));
  const d1Path = join(root, "d1.json");
  const adsPath = join(root, "ads.json");
  await writeFile(d1Path, JSON.stringify(d1));
  await writeFile(adsPath, JSON.stringify(ads));
  return spawnSync(
    process.execPath,
    ["scripts/hg10-e17-inspector.mjs", "--d1-json", d1Path, "--ads-json", adsPath],
    { encoding: "utf8" }
  );
};

const baseD1 = {
  result: "D1_READBACK_PASS",
  readOnlyGuard: true,
  targetDate: "2026-09-17",
  lineMatchedAdsCount: 1,
  businessConversionCount: 1,
  eligibleBusinessCount: 1,
  outboxCount: 1,
  providerAttemptCount: 1,
  requestIdCount: 1,
  diagnosticSuccessCount: 1,
  diagnosticFailedCount: 0,
  reconciliationCount: 0,
};
const baseAds = {
  authSource: "ACCESS_TOKEN",
  targetDateEvidence: {
    targetDate: "2026-09-17",
    rowReturned: true,
    allConversionsByConversionDate: 1,
  },
};

{
  const r = await run(baseD1, baseAds);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).state, "REPORTING_DELTA_CONFIRMED");
}
{
  const r = await run(baseD1, {
    ...baseAds,
    targetDateEvidence: {
      ...baseAds.targetDateEvidence,
      rowReturned: false,
      allConversionsByConversionDate: 0,
    },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    JSON.parse(r.stdout).state,
    "DIAGNOSTIC_SUCCESS_REPORTING_PENDING"
  );
}
{
  const r = await run({ ...baseD1, readOnlyGuard: false }, baseAds);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /HG10_E17_D1_READBACK_NOT_SAFE/);
}
console.log("HG10_E17_INSPECTOR_TEST_PASS");
