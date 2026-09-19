import { readFile } from "node:fs/promises";
import { classifyConversionClosure } from "./conversion-closure-classifier.mjs";

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const d1Path = option("--d1-json");
const adsPath = option("--ads-json");
if (!d1Path || !adsPath) {
  throw new Error("HG10_E17_INSPECTOR_REQUIRES_D1_AND_ADS_JSON");
}

const parse = async (path, label) => {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Error(`HG10_E17_${label}_JSON_INVALID`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`HG10_E17_${label}_JSON_INVALID`);
  }
  return parsed;
};

const d1 = await parse(d1Path, "D1");
const ads = await parse(adsPath, "ADS");
if (d1.result !== "D1_READBACK_PASS" || d1.readOnlyGuard !== true) {
  throw new Error("HG10_E17_D1_READBACK_NOT_SAFE");
}
const targetDateEvidence = ads.targetDateEvidence;
if (!targetDateEvidence || targetDateEvidence.targetDate !== d1.targetDate) {
  throw new Error("HG10_E17_PROVIDER_DATE_MISMATCH");
}

const verdict = classifyConversionClosure({
  lineMatchedAdsCount: d1.lineMatchedAdsCount,
  businessConversionCount: d1.businessConversionCount,
  eligibleBusinessCount: d1.eligibleBusinessCount,
  outboxCount: d1.outboxCount,
  providerAttemptCount: d1.providerAttemptCount,
  requestIdCount: d1.requestIdCount,
  diagnosticSuccessCount: d1.diagnosticSuccessCount,
  diagnosticFailedCount: d1.diagnosticFailedCount,
  reconciliationCount: d1.reconciliationCount,
  adsDateRowReturned: targetDateEvidence.rowReturned,
  adsDateConversions: targetDateEvidence.allConversionsByConversionDate,
});

console.log(
  JSON.stringify({
    schema: "hanyao.hg10-e17.inspector.v1",
    result: "HG10_E17_INSPECTION_COMPLETE",
    targetDate: d1.targetDate,
    state: verdict.state,
    d1ReadOnlyGuard: true,
    adsAuthSource: ads.authSource ?? null,
    adsDateRowReturned: targetDateEvidence.rowReturned === true,
    adsDateConversions: Number(
      targetDateEvidence.allConversionsByConversionDate ?? 0
    ),
    evidence: verdict.evidence,
  })
);
