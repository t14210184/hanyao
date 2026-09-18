import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (name) =>
  readFile(new URL(`./${name}`, import.meta.url), "utf8");

const adsReadScripts = [
  "ads-search-hygiene-audit.ts",
  "line4b-google-ads-live-preflight.ts",
  "line4d-google-ads-reporting-monitor.ts",
];

for (const name of adsReadScripts) {
  const source = await read(name);
  assert.match(source, /googleAds:searchStream/, `${name} must stay on SearchStream`);
  assert.match(source, /authorization:\s*`Bearer \$\{/, `${name} must use OAuth bearer auth`);
  assert.doesNotMatch(source, /GOOGLE_ADS_DEVELOPER_TOKEN/, `${name} must not require the retired developer token`);
  assert.doesNotMatch(source, /["']developer-token["']\s*:/, `${name} must not send the retired developer-token header`);
  assert.doesNotMatch(
    source,
    /googleAds:mutate|adGroupCriteria:mutate|campaignCriteria:mutate|customers\/[^`"']+\/[^`"']+:mutate/i,
    `${name} must not contain a Google Ads mutation endpoint`
  );
}

const auth = await read("google-ads-provider-auth.ts");
assert.match(auth, /GOOGLE_ADS_ACCESS_TOKEN/);
assert.match(auth, /GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON/);
assert.match(auth, /resolveGoogleAdsAccessToken/);
assert.doesNotMatch(
  auth,
  /console\.(?:log|error|warn)\s*\(/,
  "provider auth adapter must never print access-token or service-account material"
);
assert.doesNotMatch(
  auth,
  /child_process|execSync|spawnSync|gcloud/i,
  "provider auth adapter must consume an injected token, not invoke host CLIs"
);

for (const name of [
  "ads-search-hygiene-audit.ts",
  "ads-search-hygiene-mutate.ts",
  "ads-rsa-provider.ts",
]) {
  const source = await read(name);
  assert.match(
    source,
    /resolveGoogleAdsAccessToken/,
    `${name} must use the shared provider auth adapter`
  );
  assert.doesNotMatch(
    source,
    /exchangeServiceAccountTokenForScopes/,
    `${name} must not bypass the shared provider auth adapter`
  );
}

const hygiene = await read("ads-search-hygiene-audit.ts");
assert.match(
  hygiene,
  /if \(outputPath\) await writeFile\(outputPath, serialized, "utf8"\)/,
  "detailed search-term manifest must require an explicit output path"
);
assert.doesNotMatch(
  hygiene,
  /console\.log\(serialized\.trimEnd\(\)\)/,
  "detailed search-term manifest must never be emitted to default stdout"
);

const stdoutMarker = "// Default stdout is intentionally metadata-only.";
const stdoutBlock = hygiene.split(stdoutMarker)[1] ?? "";
assert.ok(stdoutBlock.length > 0, "metadata-only stdout boundary must be explicit");
for (const sensitiveField of [
  "searchTerm",
  "campaignName",
  "adGroupName",
  "candidateCostMicros",
  "candidateClicks",
]) {
  assert.equal(
    stdoutBlock.includes(sensitiveField),
    false,
    `default stdout must not expose ${sensitiveField}`
  );
}
assert.match(stdoutBlock, /detailOutputWritten: Boolean\(outputPath\)/);

console.log("GOOGLE_ADS_READ_CONTRACT_STATIC_PASS");
