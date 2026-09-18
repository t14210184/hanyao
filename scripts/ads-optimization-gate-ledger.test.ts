import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ADS_OPTIMIZATION_GATE_LEDGER,
  ADS_OPTIMIZATION_GATE_LEDGER_VERSION,
  allWp10RepositoryWorkPackagesRepresented,
  getWp10BlockingIds,
} from "./ads-optimization-gate-ledger.ts";

test("WP10 v2 ledger represents WP00 through WP10 and binds the current main", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER_VERSION,
    "hanyao-ads-optimization-gate-ledger-v3"
  );
  assert.equal(allWp10RepositoryWorkPackagesRepresented(), true);
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.baselineMain,
    "272e7fc513fb4c76de9cf89b92abba42e15d2e4e"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.latestRepositoryVerification.mainReadiness,
    "PASS"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.latestRepositoryVerification
      .cloudflarePagesProduction,
    "SUCCESS"
  );
});

test("WP10 never promotes provider-ready engines into live provider completion", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP01.gtmBridge.livePublishApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP02.googleAdsMutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP03.pausedCreateMutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP03.enableMutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP05.messageAssetMutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.providerMutationAppliedByLedger,
    false
  );
});

test("WP10 preserves the exact current provider authorization blockers", () => {
  assert.deepEqual(getWp10BlockingIds(), [
    "WP01_GTM_PROVIDER_AUTH",
    "WP02_GOOGLE_ADS_CONTROL_CREDENTIAL",
    "WP03_GOOGLE_ADS_CONTROL_CREDENTIAL",
    "WP05_AUTHENTICATED_GOOGLE_ADS_UI",
    "GENUINE_CANONICAL_E2E_PROVIDER_PROOF",
  ]);

  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP02.providerEvidence
      .googleAdsGitHubProbeRun,
    "35324074635"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP02.providerEvidence
      .cloudflareSurfaceProbeRun,
    "35324102187"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP02.providerEvidence
      .googleCredentialInGitHubActions,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP02.providerEvidence
      .cloudflareControlCredentialInGitHubActions,
    false
  );
  assert.deepEqual(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP01.websiteDataLayer.safeDimensions,
    [
      "service_type",
      "prepare_status",
      "handoff_type",
      "landing_path",
      "campaign_id",
    ]
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP01.websiteDataLayer
      .landingPathContainsQuery,
    false
  );
});

test("WP10 keeps later-stage Ads levers fail-closed", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP09.currentStage,
    "S1_TRACKING_PROOF_PENDING"
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP09.strategyMutationApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP09.broadMatchExpansionApplied,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP09.aiMaxApplied,
    false
  );
  assert.ok(
    ADS_OPTIMIZATION_GATE_LEDGER.prohibitedNow.includes(
      "account-wide AI Max enablement"
    )
  );
});

test("WP10 observation does not start from repository completion alone", () => {
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP08.observationStarted,
    false
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP08.minimumObservationDays,
    14
  );
  assert.equal(
    ADS_OPTIMIZATION_GATE_LEDGER.workPackages.WP08
      .preferredMessageAssetClicksIsGooglePlatformRequirement,
    false
  );
});

test("WP10 ledger source contains no provider transport or shared mutation path", async () => {
  const source = await readFile(
    "scripts/ads-optimization-gate-ledger.ts",
    "utf8"
  );

  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /tagmanager\.googleapis\.com/i);
  assert.doesNotMatch(source, /cloudflare\.com\/client\/v4/i);
  // Status fields may legitimately contain words such as
  // "MutationApplied". Fence actual provider transport primitives instead.
  assert.doesNotMatch(source, /\/[^"'\s]*:mutate\b/i);
  assert.doesNotMatch(source, /googleads:searchStream/i);
  assert.doesNotMatch(source, /authorization\s*:/i);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /child_process|execSync|spawnSync/);
});
