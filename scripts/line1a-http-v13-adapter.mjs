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
  '    "0012_provider_quality_evidence.sql",',
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
  'migration: "0001 -> existing data -> 0002 -> existing data -> 0003 -> 0012 PASS",',
  "migration result label"
);



patched = replaceExactlyOnce(
  patched,
  '  mkdirSync,\n  mkdtempSync,',
  '  mkdirSync,\n  readdirSync,\n  mkdtempSync,',
  "fs sqlite import"
);
patched = replaceExactlyOnce(
  patched,
  'import { tmpdir } from "node:os";\nimport { spawn, spawnSync } from "node:child_process";',
  'import { tmpdir } from "node:os";\nimport { DatabaseSync } from "node:sqlite";\nimport { spawn, spawnSync } from "node:child_process";',
  "node sqlite import"
);

const executeAnchor = [
  'const execute = (configPath, persistTo, command) =>',
  '  JSON.parse(',
  '    run([',
  '      "d1",',
  '      "execute",',
  '      "ATTRIBUTION_DB",',
  '      "--local",',
  '      "--persist-to",',
  '      persistTo,',
  '      "--config",',
  '      configPath,',
  '      "--json",',
  '      "--command",',
  '      command,',
  '    ])',
  '  );',
].join("\n");
const executeReplacement = [
  'const locateLocalD1Sqlite = (persistTo) => {',
  '  const directory = join(persistTo, "v3", "d1", "miniflare-D1DatabaseObject");',
  '  const candidates = readdirSync(directory).filter(',
  '    (name) => name.endsWith(".sqlite") && name !== "metadata.sqlite"',
  '  );',
  '  assert.equal(candidates.length, 1, "expected exactly one local D1 sqlite database");',
  '  return join(directory, candidates[0]);',
  '};',
  '',
  'const execute = (configPath, persistTo, command) => {',
  '  const statements = command.trim().split(";").map((part) => part.trim()).filter(Boolean);',
  '  if (statements.length === 1 && /^(SELECT|EXPLAIN)\\b/i.test(statements[0])) {',
  '    const db = new DatabaseSync(locateLocalD1Sqlite(persistTo), { readOnly: true });',
  '    try {',
  '      return [{ results: db.prepare(statements[0]).all() }];',
  '    } finally {',
  '      db.close();',
  '    }',
  '  }',
  '  return JSON.parse(',
  '    run([',
  '      "d1",',
  '      "execute",',
  '      "ATTRIBUTION_DB",',
  '      "--local",',
  '      "--persist-to",',
  '      persistTo,',
  '      "--config",',
  '      configPath,',
  '      "--json",',
  '      "--command",',
  '      command,',
  '    ])',
  '  );',
  '};',
].join("\n");
patched = replaceExactlyOnce(patched, executeAnchor, executeReplacement, "direct sqlite readback");
patched = replaceExactlyOnce(
  patched,
  '  await waitForServer(server, baseUrl, output);\n  return { server, baseUrl, output };',
  '  await waitForServer(server, baseUrl, output);\n  server.output = output;\n  return { server, baseUrl, output };',
  "server output diagnostics"
);
patched = replaceExactlyOnce(
  patched,
  '      "--log-level",\n      "error",',
  '      "--log-level",\n      "debug",',
  "wrangler debug logging"
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