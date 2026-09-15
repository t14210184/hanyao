import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relative: string) =>
  fs.readFileSync(path.join(root, relative), "utf8");

test("M07 browser attribution minimizes URL and referrer before storage", () => {
  const source = read("src/lib/attribution.ts");
  assert.match(source, /minimizeStoredUrl\(url, "landing"\)/);
  assert.match(source, /minimizeStoredUrl\(referrer, "referrer"\)/);
  assert.doesNotMatch(source, /touch\.landing_url = normalizeOptionalString\(url\)/);
});

test("M09 LINE CTA releases handoff fence after external-app return", () => {
  const source = read("src/components/CTAButton.tsx");
  assert.match(source, /lineHandoffStarted/);
  assert.match(source, /addEventListener\("pageshow"/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /lineAttemptInFlight\.current = false/);
});
test("M10 QR dialog is modal, traps focus, restores focus, and scales QR", () => {
  const source = read("src/components/LineDesktopQrDialog.tsx");
  assert.match(source, /createPortal/);
  assert.match(source, /setAttribute\("inert", ""\)/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /previousFocus\?\.focus\(\)/);
  assert.match(source, /min\(240px, 70vw\)/);
});

test("M11 required Google Ads live gate fails closed without credential", () => {
  const script = path.join(root, "scripts/line4b-google-ads-live-preflight.ts");
  const required = spawnSync(process.execPath, ["--experimental-strip-types", script], {
    env: {
      ...process.env,
      GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON: "",
      GOOGLE_ADS_LIVE_GATE_REQUIRED: "1",
    },
    encoding: "utf8",
  });
  assert.equal(required.status, 1);
  assert.match(required.stderr, /MISSING_REQUIRED_CREDENTIAL/);

  const source = read("scripts/line4b-google-ads-live-preflight.ts");
  assert.doesNotMatch(source, /include_in_conversions_metric/);
});