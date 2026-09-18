import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(`.github/workflows/${name}`, "utf8");
const auto = read("ads-line-auto-activator.yml");
const preflight = read("ads-line-production-preflight.yml");
const hardening = read("ads-line-hardening.yml");

const mutatingPatterns = [
  ["schedule", ":"].join(""),
  ["contents", ": write"].join(""),
  ["pull-requests", ": write"].join(""),
  ["issues", ": write"].join(""),
  ["actions", ": write"].join(""),
  ["d1 migrations", " apply"].join(""),
  ["wrangler deploy", " --env production"].join(""),
  ["pulls/", "/merge"].join(""),
];
for (const pattern of mutatingPatterns) {
  assert.equal(auto.includes(pattern), false, `auto activator mutation pattern: ${pattern}`);
}
for (const pattern of mutatingPatterns.slice(5)) {
  assert.equal(preflight.includes(pattern), false, `preflight mutation pattern: ${pattern}`);
}
const githubSecretExpression = ["${{", " secrets."].join("");
assert.equal(auto.includes(githubSecretExpression), false, "readiness watcher must not consume GitHub secrets");
assert.equal(preflight.includes(githubSecretExpression), false, "preflight must not consume GitHub secrets");
assert.match(auto, /permissions:\s*\n\s*contents:\s*read/);
assert.match(auto, /PRODUCTION_AUTO_ACTIVATION=DISABLED_BY_DESIGN/);
for (const family of [
  "scripts/ads-search-hygiene-*",
  "scripts/ads-rsa-*",
  "scripts/ads-line-message-*",
  "scripts/ads-optimization-*",
  "scripts/ads-landing-*",
  "scripts/google-ads-provider-*",
  "scripts/gtm-wp01-*",
]) {
  assert.equal(
    auto.includes(`- "${family}"`),
    true,
    `readiness watcher missing Ads optimization path family: ${family}`
  );
  assert.equal(
    preflight.includes(`- "${family}"`),
    true,
    `production preflight missing Ads optimization path family: ${family}`
  );
  assert.equal(
    hardening.includes(`- "${family}"`),
    true,
    `hardening missing Ads optimization path family: ${family}`
  );
}
assert.match(preflight, /wrangler deploy --dry-run --env production/);
assert.match(hardening, /test:line1a:http/);
assert.match(hardening, /v12-migration-reconstruction\.test\.mjs/);
assert.match(hardening, /test:line4a/);

console.log(JSON.stringify({
  result: "V12_WORKFLOW_SAFETY_PASS",
  autoActivatorMutations: 0,
  preflightProviderMutations: 0,
  canonicalRegressionCoverage: true,
}));
