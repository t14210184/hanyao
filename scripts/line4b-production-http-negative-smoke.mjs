import assert from "node:assert/strict";

const origin = "https://www.xusen.pro";

const prepare = await fetch(`${origin}/api/line/prepare`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: "https://invalid.example",
  },
  body: JSON.stringify({}),
});
const prepareBody = await prepare.json().catch(() => ({}));
assert.equal(prepare.status, 403, "LINE prepare must reject cross-origin requests before D1 mutation");
assert.equal(prepareBody?.error, "ORIGIN_NOT_ALLOWED");

const webhook = await fetch(`${origin}/api/line/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ destination: "line4b-negative-smoke", events: [] }),
});
const webhookBody = await webhook.json().catch(() => ({}));
assert.equal(
  webhook.status,
  401,
  "LINE webhook must have Production channel secret configured and reject a missing signature before event processing"
);
assert.equal(webhookBody?.error, "SIGNATURE_MISSING");

console.log(
  JSON.stringify({
    result: "LINE4B_PRODUCTION_HTTP_NEGATIVE_SMOKE_PASS",
    prepareCrossOriginRejected: true,
    webhookSecretConfigured: true,
    webhookMissingSignatureRejected: true,
    d1MutationExpected: false,
  })
);
