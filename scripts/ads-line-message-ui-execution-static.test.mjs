import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("WP05 UI execution contract has no provider mutation or browser automation transport", async () => {
  const contract = await readFile(
    "scripts/ads-line-message-ui-execution-contract.ts",
    "utf8"
  );
  const checker = await readFile(
    "scripts/ads-line-message-ui-evidence.ts",
    "utf8"
  );
  const combined = contract + "\n" + checker;

  assert.match(contract, /WP05_UI_PRODUCTION_GATE_REQUIRED/);
  assert.match(contract, /WP05_UI_PRESTATE_HASH_MISMATCH/);
  assert.match(contract, /BIDDING_STRATEGY_DRIFT/);
  assert.match(contract, /OPTIMIZATION_SET_DRIFT/);
  assert.match(contract, /CALL_OR_LEAD_FORM_ASSOCIATION_DRIFT/);
  assert.match(contract, /CANONICAL_HY_DRIFT/);
  assert.match(contract, /WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW/);
  assert.match(contract, /WP05_MESSAGE_ASSET_ACTIVE_PASS/);
  assert.match(contract, /DISASSOCIATE_EXACT_MESSAGE_ASSET/);

  assert.doesNotMatch(combined, /googleads\.googleapis\.com/i);
  assert.doesNotMatch(combined, /:mutate|mutate[A-Z]|mutate_/i);
  assert.doesNotMatch(combined, /puppeteer|playwright|selenium|chromium/i);
  assert.doesNotMatch(combined, /fetch\s*\(/);
  assert.doesNotMatch(combined, /child_process|execSync|spawnSync/);
});

test("WP05 evidence checker never claims that it dispatched UI mutation", async () => {
  const checker = await readFile(
    "scripts/ads-line-message-ui-evidence.ts",
    "utf8"
  );
  assert.match(checker, /evidenceOnly:\s*true/);
  assert.match(checker, /mutationApplied:\s*false/);
  assert.doesNotMatch(checker, /mutationApplied:\s*true/);
});
