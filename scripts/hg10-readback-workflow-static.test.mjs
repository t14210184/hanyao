import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  ".github/workflows/hg10-conversion-readback.yml",
  "utf8"
);

assert.match(source, /workflow_dispatch:/);
assert.match(source, /push:/);
assert.match(source, /\.github\/hg10-readback-trigger\.json/);
assert.doesNotMatch(source, /pull_request:/);
assert.match(source, /permissions:\s*\n\s*contents:\s*read/);
assert.match(source, /hg10-e17-d1-readback\.mjs/);
assert.match(source, /line4d-google-ads-reporting-monitor\.ts/);
assert.match(source, /hg10-e17-inspector\.mjs/);
assert.match(source, /CLOUDFLARE_API_TOKEN/);
assert.match(source, /GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON/);

for (const forbidden of [
  /wrangler\s+deploy/i,
  /wrangler\s+d1\s+migrations\s+apply/i,
  /wrangler\s+d1\s+execute/i,
  /googleAds:mutate/i,
  /:mutate/i,
  /events:ingest/i,
  /git\s+push/i,
  /gh\s+pr\s+merge/i,
]) {
  assert.doesNotMatch(source, forbidden);
}

console.log("HG10_READBACK_WORKFLOW_STATIC_PASS");
