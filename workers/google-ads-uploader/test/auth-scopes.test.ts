import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import {
  createServiceAccountAssertion,
  exchangeServiceAccountTokenForScopes,
  parseServiceAccountJson,
} from "../src/auth.ts";
import {
  GOOGLE_ADS_SCOPE,
  GOOGLE_OAUTH_TOKEN_URL,
  type FetchLike,
} from "../src/types.ts";

const NOW = new Date("2026-09-12T00:00:00.000Z");

const fakeServiceAccount = () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privateKeyPem = pair.privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  const email = "line4b-google-ads-preflight@example.invalid";
  const json = JSON.stringify({
    type: "service_account",
    project_id: "line4b-test-project",
    private_key_id: "generated-only",
    private_key: privateKeyPem,
    client_email: email,
    client_id: "generated-only",
    token_uri: GOOGLE_OAUTH_TOKEN_URL,
  });
  return { json, email };
};

test("scoped JWT assertion uses only the requested Google Ads scope", async () => {
  const fixture = fakeServiceAccount();
  const account = parseServiceAccountJson(fixture.json);
  const { claims } = await createServiceAccountAssertion(
    account,
    NOW,
    [GOOGLE_ADS_SCOPE, GOOGLE_ADS_SCOPE]
  );

  assert.equal(claims.iss, fixture.email);
  assert.equal(claims.scope, GOOGLE_ADS_SCOPE);
  assert.equal(claims.aud, GOOGLE_OAUTH_TOKEN_URL);
  assert.equal(claims.exp - claims.iat, 3600);
});

test("scoped token exchange sends an adwords-scoped assertion without exposing credentials", async () => {
  const fixture = fakeServiceAccount();
  let requestBody = "";
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input.toString(), GOOGLE_OAUTH_TOKEN_URL);
    requestBody = String(init?.body ?? "");
    return new Response(
      JSON.stringify({ access_token: "scoped-test-access-token", expires_in: 3600 }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as FetchLike;

  const result = await exchangeServiceAccountTokenForScopes(
    fixture.json,
    [GOOGLE_ADS_SCOPE],
    fetchImpl,
    NOW
  );
  assert.equal(result.accessToken, "scoped-test-access-token");

  const form = new URLSearchParams(requestBody);
  const assertion = form.get("assertion");
  assert.ok(assertion);
  const [, payload] = assertion.split(".");
  assert.ok(payload);
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  assert.equal(decoded.scope, GOOGLE_ADS_SCOPE);
  assert.equal(requestBody.includes("PRIVATE KEY"), false);
  assert.equal(requestBody.includes(fixture.email), false);
});

test("empty custom scope list fails closed before token exchange", async () => {
  const fixture = fakeServiceAccount();
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    throw new Error("must not be called");
  }) as FetchLike;

  await assert.rejects(
    exchangeServiceAccountTokenForScopes(fixture.json, [], fetchImpl, NOW),
    (error: unknown) =>
      error instanceof Error && error.message === "AUTH_ASSERTION_BUILD_FAILED"
  );
  assert.equal(called, false);
});
