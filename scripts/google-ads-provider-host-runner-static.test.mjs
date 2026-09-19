import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const RUNNER = "scripts/google-ads-provider-host-runner.ps1";

test("host runner is a SYSTEM-only immutable-source wrapper around existing engines", async () => {
  const source = await readFile(RUNNER, "utf8");

  for (const mode of [
    "WP02_AUDIT",
    "WP02_DRY_RUN",
    "WP02_VALIDATE",
    "WP02_APPLY",
    "WP03_DRY_RUN_CREATE",
    "WP03_VALIDATE_CREATE",
    "WP03_APPLY_PAUSED",
    "WP03_READ_ENABLE",
    "WP03_VALIDATE_ENABLE",
    "WP03_ENABLE",
    "HG10_E10_READBACK",
  ]) {
    assert.match(source, new RegExp("'" + mode + "'"));
  }

  assert.match(source, /ValidatePattern\('\^\[0-9a-fA-F\]\{40\}\$'\)/);
  assert.match(source, /NT AUTHORITY\\SYSTEM/);
  assert.match(
    source,
    /xusen-data-manager-uploader@xusen-ads-conversion\.iam\.gserviceaccount\.com/
  );
  assert.match(source, /https:\/\/www\.googleapis\.com\/auth\/adwords/);
  assert.match(source, /--impersonate-service-account=\$SERVICE_ACCOUNT/);
  assert.match(
    source,
    /https:\/\/codeload\.github\.com\/\$REPOSITORY\/zip\/\$SourceRef/
  );

  for (const engine of [
    "scripts\\\\ads-search-hygiene-audit\.ts",
    "scripts\\\\ads-search-hygiene-mutate\.ts",
    "scripts\\\\ads-rsa-provider\.ts",
  ]) {
    assert.match(source, new RegExp(engine));
  }
});

test("host runner injects only a short-lived token into the child process", async () => {
  const source = await readFile(RUNNER, "utf8");

  assert.match(
    source,
    /\$psi\.EnvironmentVariables\['GOOGLE_ADS_ACCESS_TOKEN'\] = \$AccessToken/
  );
  assert.doesNotMatch(source, /GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON/);
  assert.doesNotMatch(source, /PRIVATE KEY|private_key|client_secret/i);
  assert.doesNotMatch(source, /developer-token|GOOGLE_ADS_DEVELOPER_TOKEN/i);

  assert.match(source, /access_token_printed = \$false/);
  assert.match(source, /access_token_persisted = \$false/);
  assert.match(source, /\$accessToken = \$null/);
  assert.match(source, /Remove-Variable accessToken/);
  assert.match(source, /Remove-Item -LiteralPath \$tempRoot -Recurse -Force/);

  assert.doesNotMatch(source, /Write-(?:Output|Host).*\$accessToken/i);
  assert.doesNotMatch(source, /Out-File.*\$accessToken/i);
  assert.doesNotMatch(source, /Set-Content.*\$accessToken/i);
});

test("host runner contains no native Google Ads provider transport", async () => {
  const source = await readFile(RUNNER, "utf8");

  assert.doesNotMatch(source, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(source, /googleAds:searchStream/i);
  assert.doesNotMatch(source, /adGroupCriteria:mutate/i);
  assert.doesNotMatch(source, /adGroupAds:mutate/i);
  assert.doesNotMatch(source, /campaignBudgets:mutate/i);
  assert.doesNotMatch(source, /conversionActions:mutate/i);
  assert.doesNotMatch(source, /biddingStrategies:mutate/i);
});

test("host runner preserves existing production gates and exact plan hashes", async () => {
  const source = await readFile(RUNNER, "utf8");

  assert.match(
    source,
    /\$applyModes = @\('WP02_APPLY','WP03_APPLY_PAUSED','WP03_ENABLE'\)/
  );
  assert.match(
    source,
    /HANYAO_HOST_RUNNER_EXPECTED_PLAN_HASH_REQUIRED/
  );
  assert.match(
    source,
    /ADS_HYGIENE_EXPECTED_PLAN_HASH'\] = \$ExpectedPlanHash/
  );
  assert.match(
    source,
    /ADS_HYGIENE_PRODUCTION_GATE'\] = 'HANYAO_WP02_APPROVED_20260918'/
  );
  assert.match(
    source,
    /ADS_RSA_EXPECTED_PLAN_HASH'\] = \$ExpectedPlanHash/
  );
  assert.match(
    source,
    /HANYAO_WP03_PAUSED_CREATE_APPROVED_20260918/
  );
  assert.match(source, /HANYAO_WP03_ENABLE_APPROVED_20260918/);
});

test("host runner does not disclose gcloud config paths", async () => {
  const source = await readFile(RUNNER, "utf8");

  assert.match(source, /gcloud_config_candidates = \[int\]\$tokenResult\.config_candidates/);
  assert.match(source, /selected_config_index = \[int\]\$tokenResult\.config_index/);
  assert.doesNotMatch(source, /config_path\s*=/i);
  assert.doesNotMatch(source, /selected_config_path/i);
});


test("HG10 E10 mode is date-scoped and read-only", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(source, /HG10_E10_READBACK/);
  assert.match(source, /HANYAO_HOST_RUNNER_TARGET_DATE_REQUIRED/);
  assert.match(source, /GOOGLE_ADS_REPORTING_TARGET_DATE/);
  assert.match(source, /line4d-google-ads-reporting-monitor\.ts/);
  assert.doesNotMatch(
    source,
    /HG10_E10_READBACK[\s\S]{0,500}HANYAO_WP0[23]_APPROVED_20260918/
  );
});


test("gcloud command discovery stays array-valued under StrictMode", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(
    source,
    /\$commands = @\(\s*@\([\s\S]*?Get-Command gcloud\.cmd[\s\S]*?Where-Object[\s\S]*?\)\s*\)/
  );
});


test("gcloud impersonation warning is captured outside PowerShell native stderr semantics", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(source, /Diagnostics\.ProcessStartInfo/);
  assert.match(source, /RedirectStandardOutput = \$true/);
  assert.match(source, /RedirectStandardError = \$true/);
  assert.doesNotMatch(source, /2>\$stderrPath/);
  assert.doesNotMatch(source, /gcloud-\$index\.stderr/);
});
