import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const RUNNER = "scripts/hg10-system-readback-runner.ps1";

test("HG10 SYSTEM runner binds exact immutable source and target date", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(source, /ValidatePattern\('\^\[0-9a-fA-F\]\{40\}\$'\)/);
  assert.match(source, /NT AUTHORITY\\SYSTEM/);
  assert.match(source, /codeload\.github\.com\/\$REPOSITORY\/zip\/\$SourceRef/);
  assert.match(source, /hg10-e17-d1-readback\.mjs/);
  assert.match(source, /google-ads-provider-host-runner\.ps1/);
  assert.match(source, /hg10-e17-inspector\.mjs/);
});

test("Cloudflare OAuth token stays memory-only and D1 path is read-only", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(source, /wrangler auth token --json/);
  assert.match(source, /CLOUDFLARE_API_TOKEN/);
  assert.match(source, /cloudflare_token_printed = \$false/);
  assert.match(source, /cloudflare_token_persisted = \$false/);
  assert.doesNotMatch(source, /wrangler d1 execute/i);
  assert.doesNotMatch(source, /wrangler deploy/i);
  assert.doesNotMatch(source, /events:ingest/i);
  assert.doesNotMatch(source, /googleAds:mutate/i);
  assert.doesNotMatch(source, /:mutate/i);
  assert.doesNotMatch(source, /WriteAllText\([^\n]*cloudflareToken/i);
});

test("Cloudflare auth requires one exact account before D1 dispatch", async () => {
  const source = await readFile(RUNNER, "utf8");

  assert.match(source, /HG10_WRANGLER_AUTH_SURFACE_NOT_FOUND/);
  assert.match(source, /HG10_CLOUDFLARE_ACCOUNT_AMBIGUOUS/);
  assert.match(source, /accounts\.Count -ne 1/);
  assert.match(source, /accountId -notmatch '\^\[0-9a-fA-F\]\{32\}\$'/);
  assert.match(source, /wrangler auth token --json[\s\S]*wrangler whoami --json/);
  assert.match(source, /CLOUDFLARE_API_TOKEN = \$cloudflareToken/);
});

test("child process output is bounded and no shell LASTEXITCODE is used", async () => {
  const source = await readFile(RUNNER, "utf8");
  assert.match(source, /Diagnostics\.ProcessStartInfo/);
  assert.match(source, /RedirectStandardOutput = \$true/);
  assert.match(source, /RedirectStandardError = \$true/);
  assert.doesNotMatch(source, /LASTEXITCODE/);
  assert.match(source, /HG10_CHILD_OUTPUT_TOO_LARGE/);
});
