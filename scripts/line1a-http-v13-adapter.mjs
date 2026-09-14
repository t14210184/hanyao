import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const sourcePath = join(cwd, "scripts", "line1a-http-integration.mjs");
const source = readFileSync(sourcePath, "utf8").replaceAll("\r\n", "\n");

const replaceExactlyOnce = (text, needle, replacement, label) => {
  const first = text.indexOf(needle);
  assert.notEqual(first, -1, `${label}: anchor missing`);
  assert.equal(text.indexOf(needle, first + needle.length), -1, `${label}: anchor not unique`);
  return text.slice(0, first) + replacement + text.slice(first + needle.length);
};

let patched = source;
patched = replaceExactlyOnce(
  patched,
  'import { createHmac } from "node:crypto";',
  'import { createHash, createHmac } from "node:crypto";',
  "crypto import"
);

const migrationAnchor = [
  '    "0008_attribution_abuse_rate_state.sql",',
  '  ]) {',
].join("\n");
const migrationReplacement = [
  '    "0008_attribution_abuse_rate_state.sql",',
  '    "0009_immutable_lead_attribution_snapshot.sql",',
  '    "0010_provider_transport_recovery.sql",',
  '    "0011_atomic_terminal_completion.sql",',
  '  ]) {',
].join("\n");
patched = replaceExactlyOnce(
  patched,
  migrationAnchor,
  migrationReplacement,
  "migration list"
);

const snapshotBlock = [
  '  const snapshotFixtures = [',
  '    { token: "HY-AAAAAAAAAA", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-BBBBBBBBBB", session: "session-gbraid", selected: "first", gclid: null, gbraid: "GBRAID-ONLY", wbraid: null },',
  '    { token: "HY-CCCCCCCCCC", session: "session-wbraid", selected: "first", gclid: null, gbraid: null, wbraid: "WBRAID-ONLY" },',
  '    { token: "HY-DDDDDDDDDD", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-EEEEEEEEEE", session: "session-first", selected: "first", gclid: "FIRST-FALLBACK", gbraid: null, wbraid: null },',
  '    { token: "HY-FFFFFFFFFF", session: "session-no-ads", selected: null, gclid: null, gbraid: null, wbraid: null },',
  '    { token: "HY-GGGGGGGGGG", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-MMMMMMMMMM", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-NNNNNNNNNN", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-PPPPPPPPPP", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-QQQQQQQQQQ", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-RRRRRRRRRR", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-SSSSSSSSSS", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-TTTTTTTTTT", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-UUUUUUUUUU", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '    { token: "HY-VVVVVVVVVV", session: "session-last", selected: "last", gclid: "LAST-LAST", gbraid: null, wbraid: null },',
  '  ];',
  '  const snapshotUpdateSql = snapshotFixtures.map((fixture) => {',
  '    const snapshot = {',
  '      schema_version: 1,',
  '      session_reference: fixture.session,',
  '      selected_touch: fixture.selected,',
  '      gclid: fixture.gclid,',
  '      gbraid: fixture.gbraid,',
  '      wbraid: fixture.wbraid,',
  '      touch_captured_at: null,',
  '      issued_at: nowIso,',
  '      session_expires_at: expiresIso,',
  '      source_rule_version: "google-ads-last-then-first-v1",',
  '    };',
  '    const json = JSON.stringify(snapshot);',
  '    const hash = createHash("sha256").update(json).digest("hex");',
  '    const quote = (value) => String(value).replaceAll("\'", "\'\'");',
  '    return "UPDATE lead_tokens SET attribution_snapshot_json = \'" + quote(json) + "\', attribution_snapshot_hash = \'" + hash + "\', lineage_rule_version = \'google-ads-last-then-first-v1\' WHERE lead_token = \'" + quote(fixture.token) + "\';";',
  '  }).join("\\n");',
  '  execute(migrationRoots.v3, persistTo, snapshotUpdateSql);',
].join("\n");
const seedAnchor = '  execute(migrationRoots.v3, persistTo, seedSql);';
patched = replaceExactlyOnce(
  patched,
  seedAnchor,
  seedAnchor + "\n" + snapshotBlock,
  "snapshot seed hook"
);

patched = replaceExactlyOnce(
  patched,
  'migration: "0001 -> existing data -> 0002 -> existing data -> 0003 -> 0008 PASS",',
  'migration: "0001 -> existing data -> 0002 -> existing data -> 0003 -> 0011 PASS",',
  "migration result label"
);

const tempRoot = mkdtempSync(join(tmpdir(), "line1a-v13-adapter-"));
const generatedPath = join(tempRoot, "line1a-http-integration.mjs");
writeFileSync(generatedPath, patched, "utf8");

const child = spawnSync(process.execPath, [generatedPath], {
  cwd,
  stdio: "inherit",
  env: process.env,
});
rmSync(tempRoot, { recursive: true, force: true });

if (child.error) throw child.error;
process.exit(child.status ?? 1);
