import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules", "wrangler", "bin", "wrangler.js");
const secret = "line1a-local-dummy-secret";
const identitySecret = "line1a-local-dummy-identity-secret";
const expectedDestination = "Ua84119b8b81029fd10868116f1937d13";
const canonicalEventTimestamp = Date.parse("2026-09-09T12:00:00.000Z");
const compatibilityDate = "2026-08-24";
const nowIso = "2026-08-25T12:00:00.000Z";
const expiresIso = "2026-11-23T12:00:00.000Z";

const run = (args, runCwd = cwd) => {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: runCwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      "Wrangler failed: " +
        args.join(" ") +
        "\n" +
        result.stdout +
        "\n" +
        result.stderr
    );
  }
  return result.stdout;
};

const writeConfig = (root, migrationsDir, pagesBuildOutputDir = null) => {
  mkdirSync(join(root, "migrations"), { recursive: true });
  const configPath = join(root, "wrangler.jsonc");
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        name: "hanyao-line1a-local",
        compatibility_date: compatibilityDate,
        ...(pagesBuildOutputDir
          ? { pages_build_output_dir: pagesBuildOutputDir }
          : {}),
        d1_databases: [
          {
            binding: "ATTRIBUTION_DB",
            database_name: "hanyao-line1a-local",
            database_id: "LINE1A_LOCAL_ONLY_NO_PRODUCTION_ID",
            preview_database_id: "line1a-local-attribution",
            migrations_dir: migrationsDir,
          },
        ],
      },
      null,
      2
    )
  );
  return configPath;
};

const execute = (configPath, persistTo, command) =>
  JSON.parse(
    run([
      "d1",
      "execute",
      "ATTRIBUTION_DB",
      "--local",
      "--persist-to",
      persistTo,
      "--config",
      configPath,
      "--json",
      "--command",
      command,
    ])
  );

const applyMigrations = (configPath, persistTo) =>
  run([
    "d1",
    "migrations",
    "apply",
    "ATTRIBUTION_DB",
    "--local",
    "--persist-to",
    persistTo,
    "--config",
    configPath,
  ]);

const makeMigrationRoots = () => {
  const root = mkdtempSync(join(tmpdir(), "line1a-migrations-"));
  const v1 = join(root, "v1");
  const v2 = join(root, "v2");
  const v3 = join(root, "v3");
  for (const directory of [v1, v2, v3]) {
    mkdirSync(join(directory, "migrations"), { recursive: true });
    copyFileSync(
      join(cwd, "migrations/0001_attribution_v1.sql"),
      join(directory, "migrations/0001_attribution_v1.sql")
    );
  }
  copyFileSync(
    join(cwd, "migrations/0002_attribution_retention_integrity.sql"),
    join(v2, "migrations/0002_attribution_retention_integrity.sql")
  );
  copyFileSync(
    join(cwd, "migrations/0002_attribution_retention_integrity.sql"),
    join(v3, "migrations/0002_attribution_retention_integrity.sql")
  );
  copyFileSync(
    join(cwd, "migrations/0003_line_webhook_foundation.sql"),
    join(v3, "migrations/0003_line_webhook_foundation.sql")
  );
  copyFileSync(
    join(cwd, "migrations/0004_google_uploader_state.sql"),
    join(v3, "migrations/0004_google_uploader_state.sql")
  );
  for (const name of [
    "0005_business_conversion_identity_contract.sql",
    "0006_p1c2_i2_canonical_integrity.sql",
    "0007_canonical_outbox_delivery.sql",
    "0008_attribution_abuse_rate_state.sql",
    "0013_high_intent_signal_shadow.sql",
  ]) {
    copyFileSync(join(cwd, "migrations", name), join(v3, "migrations", name));
  }
  return {
    v1: writeConfig(v1, "./migrations"),
    v2: writeConfig(v2, "./migrations"),
    v3: writeConfig(v3, "./migrations"),
    v3Root: v3,
  };
};

const makeRuntime = (migrationsRoot, persistTo, port, withSecret) => {
  const runtimeDir = mkdtempSync(join(tmpdir(), "line1a-pages-runtime-"));
  symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
  symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
  symlinkSync(
    join(migrationsRoot, "migrations"),
    join(runtimeDir, "migrations"),
    "dir"
  );
  const configPath = writeConfig(runtimeDir, "./migrations", "./out");
  if (withSecret) {
    writeFileSync(
      join(runtimeDir, ".dev.vars"),
      "LINE_CHANNEL_SECRET=" + JSON.stringify(secret) + "\n" +
        "LINE_USER_KEY_HMAC_SECRET=" + JSON.stringify(identitySecret) + "\n"
    );
  }
  return { runtimeDir, configPath, persistTo, port };
};

const waitForServer = async (server, baseUrl, output) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) {
      throw new Error("Pages dev exited early: " + output.join("").slice(-2000));
    }
    try {
      if ((await fetch(baseUrl + "/")).status === 200) return;
    } catch {
      // Keep waiting for the local Pages server.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for local Pages dev");
};

const startServer = async (runtime) => {
  const baseUrl = "http://127.0.0.1:" + runtime.port;
  const output = [];
  const server = spawn(
    process.execPath,
    [wrangler,
      "pages",
      "dev",
      "out",
      "--local",
      "--persist-to",
      runtime.persistTo,
      "--ip",
      "127.0.0.1",
      "--port",
      String(runtime.port),
      "--log-level",
      "error",
      "--show-interactive-dev-session=false",
    ],
    { cwd: runtime.runtimeDir, stdio: ["ignore", "pipe", "pipe"] }
  );
  server.stdout.on("data", (chunk) => output.push(String(chunk)));
  server.stderr.on("data", (chunk) => output.push(String(chunk)));
  await waitForServer(server, baseUrl, output);
  return { server, baseUrl, output };
};

const stopServer = async (server) => {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  const startedAt = Date.now();
  while (server.exitCode === null && Date.now() - startedAt < 5000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (server.exitCode === null) server.kill("SIGKILL");
};

const postRaw = async (
  baseUrl,
  rawBody,
  options = {}
) => {
  const headers = { "Content-Type": "application/json" };
  if (options.signature !== null && options.signature !== undefined) {
    headers["x-line-signature"] = options.signature;
  } else if (!options.omitSignature) {
    headers["x-line-signature"] = createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");
  }
  const response = await fetch(baseUrl + "/api/line/webhook", {
    method: "POST",
    headers,
    body: rawBody,
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
};

const postPayload = async (baseUrl, payload, options = {}) =>
  postRaw(
    baseUrl,
    JSON.stringify({ destination: expectedDestination, ...payload }),
    options
  );

const lineTextEvent = (
  webhookEventId, messageId, text,
  timestamp = canonicalEventTimestamp,
  userId = "line-user-" + webhookEventId,
  sourceType = "user",
  isRedelivery = false
) => ({
  type: "message", webhookEventId, timestamp,
  source: userId ? { type: sourceType, userId } : { type: sourceType },
  deliveryContext: { isRedelivery },
  message: { id: messageId, type: "text", text },
});

const lineFollowEvent = (
  webhookEventId, timestamp = canonicalEventTimestamp,
  userId = "line-user-" + webhookEventId
) => ({
  type: "follow", webhookEventId, timestamp,
  source: { type: "user", userId },
  deliveryContext: { isRedelivery: false },
});

const assertStatus = (result, status, label) => {
  assert.equal(result.status, status, label + ": unexpected status");
};

const assertBodyStatus = (result, status, label) => {
  assert.equal(result.body?.status, status, label + ": unexpected body status");
};

const lineEvents = (configPath, persistTo) =>
  execute(
    configPath,
    persistTo,
    "SELECT line_event_id, webhook_event_id, message_id, lead_token, event_type, match_status, line_event_timestamp, line_user_key, identity_state, identity_key_id, line_destination, business_subject_kind, business_subject_key FROM line_events ORDER BY created_at, line_event_id;"
  )[0].results;

const outboxRows = (configPath, persistTo) =>
  execute(
    configPath,
    persistTo,
    "SELECT conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid, wbraid, attribution_touch, transaction_id, destination_key, status, retry_count, next_retry_at, last_error_code, sent_at FROM conversion_outbox ORDER BY created_at, conversion_id;"
  )[0].results;

const businessRows = (configPath, persistTo) =>
  execute(configPath, persistTo,
    "SELECT business_conversion_id, first_lead_token, subject_kind, subject_key, transaction_id, dedupe_until, eligibility_state, outcome_state FROM business_conversions ORDER BY created_at, business_conversion_id;"
  )[0].results;
const tokenClaims = (configPath, persistTo) =>
  execute(configPath, persistTo,
    "SELECT lead_token, claimant_kind, claimant_key, business_conversion_id FROM token_claims ORDER BY lead_token;"
  )[0].results;
const tokenConflicts = (configPath, persistTo) =>
  execute(configPath, persistTo,
    "SELECT lead_token, first_claimant_key, observed_claimant_key, reason_code, review_state FROM token_claim_conflicts ORDER BY observed_at, conflict_id;"
  )[0].results;
const dedupeLocks = (configPath, persistTo) =>
  execute(configPath, persistTo,
    "SELECT subject_key, active_business_conversion_id, dedupe_until, last_lineage_observed_at, fence_version FROM business_conversion_dedupe_locks ORDER BY subject_key;"
  )[0].results;
const counts = (configPath, persistTo) => ({
  lineEvents: lineEvents(configPath, persistTo).length,
  outbox: outboxRows(configPath, persistTo).length,
});

const shadowRows = (configPath, persistTo) =>
  execute(
    configPath,
    persistTo,
    "SELECT o.observation_id,o.line_event_id,e.webhook_event_id,o.line_user_key,o.lead_token,o.rule_version,o.match_status,o.attribution_lane,o.service_signal,o.transaction_intent_signal,o.location_signal,o.schedule_signal,o.contact_signal,o.qualified_candidate FROM lead_signal_observations o JOIN line_events e ON e.line_event_id=o.line_event_id ORDER BY o.created_at,o.observation_id;"
  )[0].results;
const identifierRows = (configPath, persistTo) =>
  execute(
    configPath,
    persistTo,
    "SELECT identifier_id,line_user_key,identifier_type,identifier_hash,source_line_event_id FROM lead_user_identifiers ORDER BY first_seen_at,identifier_id;"
  )[0].results;

const seedSql = [
  "INSERT INTO attribution_sessions (session_id, schema_version, first_gclid, last_gclid, server_created_at, server_updated_at, expires_at) VALUES",
  "('session-last', 1, 'FIRST-LAST', 'LAST-LAST', '" + nowIso + "', '" + nowIso + "', '" + expiresIso + "'),",
  "('session-first', 1, 'FIRST-FALLBACK', NULL, '" + nowIso + "', '" + nowIso + "', '" + expiresIso + "'),",
  "('session-gbraid', 1, NULL, NULL, '" + nowIso + "', '" + nowIso + "', '" + expiresIso + "'),",
  "('session-wbraid', 1, NULL, NULL, '" + nowIso + "', '" + nowIso + "', '" + expiresIso + "'),",
  "('session-no-ads', 1, NULL, NULL, '" + nowIso + "', '" + nowIso + "', '" + expiresIso + "');",
  "UPDATE attribution_sessions SET first_gbraid = 'GBRAID-ONLY' WHERE session_id = 'session-gbraid';",
  "UPDATE attribution_sessions SET first_wbraid = 'WBRAID-ONLY' WHERE session_id = 'session-wbraid';",
  "INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES",
  "('HY-AAAAAAAAAA', 'line1a-request-a', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-BBBBBBBBBB', 'line1a-request-b', 'session-gbraid', 'line', 'issued', '" + nowIso + "'),",
  "('HY-CCCCCCCCCC', 'line1a-request-c', 'session-wbraid', 'line', 'issued', '" + nowIso + "'),",
  "('HY-DDDDDDDDDD', 'line1a-request-d', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-EEEEEEEEEE', 'line1a-request-e', 'session-first', 'line', 'issued', '" + nowIso + "'),",
  "('HY-FFFFFFFFFF', 'line1a-request-f', 'session-no-ads', 'line', 'issued', '" + nowIso + "'),",
  "('HY-GGGGGGGGGG', 'line1a-request-g', 'session-last', 'phone', 'issued', '" + nowIso + "'),",
  "('HY-MMMMMMMMMM', 'line1a-request-m', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-NNNNNNNNNN', 'line1a-request-n', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-PPPPPPPPPP', 'line1a-request-p', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-QQQQQQQQQQ', 'line1a-request-q', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-RRRRRRRRRR', 'line1a-request-r', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-SSSSSSSSSS', 'line1a-request-s', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-TTTTTTTTTT', 'line1a-request-t', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-UUUUUUUUUU', 'line1a-request-u', 'session-last', 'line', 'issued', '" + nowIso + "'),",
  "('HY-VVVVVVVVVV', 'line1a-request-v', 'session-last', 'line', 'issued', '" + nowIso + "');",
].join("\n");

let server;
let missingSecretServer;
let configPath;
let persistTo;
let migrationRoots;

try {
  assert.equal(existsSync(join(cwd, "out")), true, "build output out/ is required");

  migrationRoots = makeMigrationRoots();
  persistTo = mkdtempSync(join(tmpdir(), "line1a-d1-"));

  applyMigrations(migrationRoots.v1, persistTo);
  execute(
    migrationRoots.v1,
    persistTo,
    "INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at) VALUES ('legacy-before-v2', 1, '" +
      nowIso +
      "', '" +
      nowIso +
      "', '" +
      expiresIso +
      "'); INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES ('HY-LEGACY0001', 'legacy-request-1', 'legacy-before-v2', 'form', 'issued', '" +
      nowIso +
      "');"
  );
  applyMigrations(migrationRoots.v2, persistTo);
  execute(
    migrationRoots.v2,
    persistTo,
    "INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at) VALUES ('legacy-before-v3', 1, '" +
      nowIso +
      "', '" +
      nowIso +
      "', '" +
      expiresIso +
      "'); INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES ('HY-LEGACY0002', 'legacy-request-2', 'legacy-before-v3', 'line', 'issued', '" +
      nowIso +
      "');"
  );
  applyMigrations(migrationRoots.v3, persistTo);

  const migrationReadback = execute(
    migrationRoots.v3,
    persistTo,
    "SELECT session_id FROM attribution_sessions WHERE session_id LIKE 'legacy-%' ORDER BY session_id; SELECT lead_token, session_id FROM lead_tokens WHERE request_id LIKE 'legacy-request-%' ORDER BY request_id; SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('line_events', 'conversion_outbox') ORDER BY name;"
  );
  assert.deepEqual(
    migrationReadback[0].results.map((row) => row.session_id),
    ["legacy-before-v2", "legacy-before-v3"]
  );
  assert.deepEqual(
    migrationReadback[1].results.map((row) => row.lead_token),
    ["HY-LEGACY0001", "HY-LEGACY0002"]
  );
  assert.deepEqual(
    migrationReadback[2].results.map((row) => row.name),
    ["conversion_outbox", "line_events"]
  );

  execute(migrationRoots.v3, persistTo, seedSql);
  const runtime = makeRuntime(migrationRoots.v3Root, persistTo, 8791, true);
  configPath = runtime.configPath;
  const running = await startServer(runtime);
  server = running.server;

  const initialCounts = counts(configPath, persistTo);
  const empty = { events: [] };
  const w1 = await postPayload(running.baseUrl, empty);
  assertStatus(w1, 200, "W1");
  assertBodyStatus(w1, "accepted", "W1");
  assert.deepEqual(counts(configPath, persistTo), initialCounts);

  const w2 = await postPayload(running.baseUrl, empty, { omitSignature: true });
  assertStatus(w2, 401, "W2");
  assert.deepEqual(counts(configPath, persistTo), initialCounts);

  const w3 = await postPayload(running.baseUrl, empty, {
    signature: "invalid-signature",
  });
  assertStatus(w3, 401, "W3");
  assert.deepEqual(counts(configPath, persistTo), initialCounts);

  const signedBodyForW4 = JSON.stringify({ events: [] });
  const tamperedBodyForW4 = JSON.stringify({ events: [lineFollowEvent("W4")] });
  const w4 = await postRaw(running.baseUrl, tamperedBodyForW4, {
    signature: createHmac("sha256", secret)
      .update(signedBodyForW4)
      .digest("base64"),
  });
  assertStatus(w4, 401, "W4");
  assert.deepEqual(counts(configPath, persistTo), initialCounts);

  const oversized = "x".repeat(128 * 1024 + 1);
  const w5 = await postRaw(running.baseUrl, oversized);
  assertStatus(w5, 413, "W5");
  assert.deepEqual(counts(configPath, persistTo), initialCounts);

  const w6Payload = { events: [lineTextEvent("W6", "M6", "您好 HY-AAAAAAAAAA")] };
  const w6 = await postPayload(running.baseUrl, w6Payload);
  assertStatus(w6, 200, "W6");
  assertBodyStatus(w6, "accepted", "W6");
  const afterW6 = counts(configPath, persistTo);
  assert.deepEqual(afterW6, { lineEvents: 1, outbox: 1 });
  const w6Event = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W6"
  );
  assert.equal(w6Event.match_status, "MATCHED_ADS");
  assert.equal(w6Event.lead_token, "HY-AAAAAAAAAA");
  const w6Outbox = outboxRows(configPath, persistTo).find(
    (row) => row.lead_token === "HY-AAAAAAAAAA"
  );
  assert.equal(w6Outbox.gclid, "LAST-LAST");
  assert.equal(w6Outbox.attribution_touch, "last");
  assert.match(w6Outbox.transaction_id, /^[0-9a-f-]{36}$/);
  assert.equal(w6Outbox.destination_key, "HY_VERIFIED_LINE_CONTACT");

  const w7 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W7", "M7", "HY-BBBBBBBBBB")],
  });
  assertStatus(w7, 200, "W7");
  assert.equal(
    outboxRows(configPath, persistTo).find(
      (row) => row.lead_token === "HY-BBBBBBBBBB"
    ).gbraid,
    "GBRAID-ONLY"
  );

  const w8 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W8", "M8", "HY-CCCCCCCCCC")],
  });
  assertStatus(w8, 200, "W8");
  assert.equal(
    outboxRows(configPath, persistTo).find(
      (row) => row.lead_token === "HY-CCCCCCCCCC"
    ).wbraid,
    "WBRAID-ONLY"
  );

  const w9 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W9", "M9", "HY-DDDDDDDDDD")],
  });
  assertStatus(w9, 200, "W9");
  const w9Outbox = outboxRows(configPath, persistTo).find(
    (row) => row.lead_token === "HY-DDDDDDDDDD"
  );
  assert.equal(w9Outbox.gclid, "LAST-LAST");
  assert.equal(w9Outbox.attribution_touch, "last");

  const w10 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W10", "M10", "HY-EEEEEEEEEE")],
  });
  assertStatus(w10, 200, "W10");
  const w10Outbox = outboxRows(configPath, persistTo).find(
    (row) => row.lead_token === "HY-EEEEEEEEEE"
  );
  assert.equal(w10Outbox.gclid, "FIRST-FALLBACK");
  assert.equal(w10Outbox.attribution_touch, "first");

  const beforeW11 = counts(configPath, persistTo);
  const w11 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W11", "M11", "HY-FFFFFFFFFF")],
  });
  assertStatus(w11, 200, "W11");
  const w11Event = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W11"
  );
  assert.equal(w11Event.match_status, "MATCHED_UNATTRIBUTED");
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW11.lineEvents + 1,
    outbox: beforeW11.outbox,
  });

  const beforeW12 = counts(configPath, persistTo);
  const w12 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W12", "M12", "沒有代碼")],
  });
  assertStatus(w12, 200, "W12");
  assert.equal(
    lineEvents(configPath, persistTo).find(
      (row) => row.webhook_event_id === "W12"
    ).match_status,
    "UNMATCHED"
  );
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW12.lineEvents + 1,
    outbox: beforeW12.outbox,
  });

  const beforeW13 = counts(configPath, persistTo);
  const w13 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W13", "M13", "HY-ZZZZZZZZZZ")],
  });
  assertStatus(w13, 200, "W13");
  assert.equal(
    lineEvents(configPath, persistTo).find(
      (row) => row.webhook_event_id === "W13"
    ).match_status,
    "UNMATCHED"
  );
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW13.lineEvents + 1,
    outbox: beforeW13.outbox,
  });

  const beforeW14 = counts(configPath, persistTo);
  const w14 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W14", "M14", "HY-GGGGGGGGGG")],
  });
  assertStatus(w14, 200, "W14");
  assert.equal(
    lineEvents(configPath, persistTo).find(
      (row) => row.webhook_event_id === "W14"
    ).match_status,
    "WRONG_CHANNEL"
  );
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW14.lineEvents + 1,
    outbox: beforeW14.outbox,
  });

  const beforeW15 = counts(configPath, persistTo);
  const w15 = await postPayload(running.baseUrl, {
    events: [
      lineTextEvent(
        "W15",
        "M15",
        "HY-HHHHHHHHHH 與 HY-JJJJJJJJJJ"
      ),
    ],
  });
  assertStatus(w15, 200, "W15");
  assert.equal(
    lineEvents(configPath, persistTo).find(
      (row) => row.webhook_event_id === "W15"
    ).match_status,
    "AMBIGUOUS"
  );
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW15.lineEvents + 1,
    outbox: beforeW15.outbox,
  });

  const w16 = await postPayload(running.baseUrl, {
    events: [
      lineTextEvent(
        "W16",
        "M16",
        "HY-MMMMMMMMMM / HY-MMMMMMMMMM"
      ),
    ],
  });
  assertStatus(w16, 200, "W16");
  assert.equal(
    outboxRows(configPath, persistTo).filter(
      (row) => row.lead_token === "HY-MMMMMMMMMM"
    ).length,
    1
  );

  const w17Payload = { events: [lineTextEvent("W17", "M17", "HY-NNNNNNNNNN")] };
  const w17 = await postPayload(running.baseUrl, w17Payload);
  assertStatus(w17, 200, "W17 first delivery");
  const beforeW17Duplicate = counts(configPath, persistTo);
  const w17TransactionId = outboxRows(configPath, persistTo).find(
    (row) => row.lead_token === "HY-NNNNNNNNNN"
  ).transaction_id;
  const w17Duplicate = await postPayload(running.baseUrl, w17Payload);
  assertStatus(w17Duplicate, 200, "W17 duplicate");
  assertBodyStatus(w17Duplicate, "duplicate", "W17 duplicate");
  assert.deepEqual(counts(configPath, persistTo), beforeW17Duplicate);
  assert.equal(
    outboxRows(configPath, persistTo).find(
      (row) => row.lead_token === "HY-NNNNNNNNNN"
    ).transaction_id,
    w17TransactionId
  );

  const beforeW18 = counts(configPath, persistTo);
  const w18 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W18-new-event", "M17", "HY-NNNNNNNNNN")],
  });
  assertStatus(w18, 200, "W18");
  assertBodyStatus(w18, "duplicate", "W18");
  assert.deepEqual(counts(configPath, persistTo), beforeW18);

  const beforeW19 = counts(configPath, persistTo);
  for (let index = 0; index < 20; index += 1) {
    const result = await postPayload(running.baseUrl, {
      events: [
        lineTextEvent(
          "W19-" + String(index),
          "M19-" + String(index),
          "再次聯絡 HY-NNNNNNNNNN",
          canonicalEventTimestamp,
          "line-user-W17"
        ),
      ],
    });
    assertStatus(result, 200, "W19-" + String(index));
  }
  const afterW19 = counts(configPath, persistTo);
  assert.equal(afterW19.lineEvents, beforeW19.lineEvents + 20);
  assert.equal(
    outboxRows(configPath, persistTo).filter(
      (row) => row.lead_token === "HY-NNNNNNNNNN"
    ).length,
    1
  );

  const w20 = await postPayload(running.baseUrl, {
    events: [
      lineTextEvent(
        "W20",
        "M20",
        "displayName@example.test HY-PPPPPPPPPP"
      ),
    ],
  });
  assertStatus(w20, 200, "W20");
  const w20Readback = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W20"
  );
  assert.match(w20Readback.line_user_key, /^lu_v1_[A-Za-z0-9_-]{43}$/);
  assert.equal(w20Readback.identity_state, "KNOWN");
  assert.equal(w20Readback.identity_key_id, "current");
  assert.equal(w20Readback.line_destination, expectedDestination);
  assert.equal(w20Readback.business_subject_kind, "LINE_USER_HMAC");
  assert.equal(w20Readback.business_subject_key, w20Readback.line_user_key);
  const lineEventSchema = execute(
    configPath,
    persistTo,
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'line_events';"
  )[0].results[0].sql;
  assert.equal(/message_text|message_excerpt|displayName|userId/i.test(lineEventSchema), false);
  assert.equal(
    lineEvents(configPath, persistTo).some((row) => row.line_user_key === "line-user-W20"),
    false
  );
  const w20Shadow = shadowRows(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W20"
  );
  assert.equal(w20Shadow?.attribution_lane, "EXACT_CLICK");
  assert.equal(w20Shadow?.contact_signal, 1);
  const w20Identifiers = identifierRows(configPath, persistTo).filter(
    (row) => row.source_line_event_id === w20Readback.line_event_id
  );
  assert.equal(w20Identifiers.length, 1);
  assert.equal(w20Identifiers[0].identifier_type, "EMAIL_SHA256");
  assert.match(w20Identifiers[0].identifier_hash, /^[0-9a-f]{64}$/);

  const beforeW22 = counts(configPath, persistTo);
  const w22 = await postPayload(running.baseUrl, {
    events: [lineFollowEvent("W22")],
  });
  assertStatus(w22, 200, "W22");
  assertBodyStatus(w22, "ignored", "W22");
  const w22Event = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W22"
  );
  assert.equal(w22Event.match_status, "IGNORED_NON_TEXT");
  assert.deepEqual(counts(configPath, persistTo), {
    lineEvents: beforeW22.lineEvents + 1,
    outbox: beforeW22.outbox,
  });

  const beforeW23 = counts(configPath, persistTo);
  const w23a = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W23-A", "M23-A", "HY-QQQQQQQQQQ", canonicalEventTimestamp, "line-user-dedupe")],
  });
  assertStatus(w23a, 200, "W23-A");
  const qClaim = tokenClaims(configPath, persistTo).find((row) => row.lead_token === "HY-QQQQQQQQQQ");
  assert.ok(qClaim?.business_conversion_id);
  const afterW23a = counts(configPath, persistTo);
  assert.equal(afterW23a.outbox, beforeW23.outbox + 1);
  const w23b = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W23-B", "M23-B", "HY-RRRRRRRRRR", canonicalEventTimestamp, "line-user-dedupe")],
  });
  assertStatus(w23b, 200, "W23-B");
  const rClaim = tokenClaims(configPath, persistTo).find((row) => row.lead_token === "HY-RRRRRRRRRR");
  assert.equal(rClaim?.business_conversion_id, qClaim.business_conversion_id);
  assert.equal(counts(configPath, persistTo).outbox, afterW23a.outbox);

  const beforeW24Conflicts = tokenConflicts(configPath, persistTo).length;
  const w24a = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W24-A", "M24-A", "HY-SSSSSSSSSS", canonicalEventTimestamp, "line-user-owner")],
  });
  assertStatus(w24a, 200, "W24-A");
  const beforeW24b = counts(configPath, persistTo);
  const w24b = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W24-B", "M24-B", "HY-SSSSSSSSSS", canonicalEventTimestamp, "line-user-conflict")],
  });
  assertStatus(w24b, 200, "W24-B");
  assertBodyStatus(w24b, "ignored", "W24-B");
  assert.equal(counts(configPath, persistTo).outbox, beforeW24b.outbox);
  assert.equal(tokenConflicts(configPath, persistTo).length, beforeW24Conflicts + 1);

  const beforeW25 = counts(configPath, persistTo);
  const w25 = await postPayload(running.baseUrl, {
    destination: "Uwrong-destination",
    events: [lineTextEvent("W25", "M25", "HY-TTTTTTTTTT")],
  });
  assertStatus(w25, 200, "W25");
  assert.equal(lineEvents(configPath, persistTo).find((row) => row.webhook_event_id === "W25").match_status, "WRONG_CHANNEL");
  assert.equal(counts(configPath, persistTo).outbox, beforeW25.outbox);

  const beforeW26 = counts(configPath, persistTo);
  const w26 = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W26", "M26", "HY-UUUUUUUUUU", canonicalEventTimestamp, null, "group")],
  });
  assertStatus(w26, 200, "W26");
  const w26Event = lineEvents(configPath, persistTo).find((row) => row.webhook_event_id === "W26");
  assert.equal(w26Event.identity_state, "ABSENT");
  assert.equal(w26Event.line_user_key, null);
  assert.equal(counts(configPath, persistTo).outbox, beforeW26.outbox);

  const w27Payload = {
    events: [lineTextEvent("W27", "M27", "HY-VVVVVVVVVV", canonicalEventTimestamp, "line-user-redelivery")],
  };
  const w27 = await postPayload(running.baseUrl, w27Payload);
  assertStatus(w27, 200, "W27 first");
  const beforeW27Redelivery = counts(configPath, persistTo);
  const w27Key = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W27"
  ).line_user_key;
  const beforeW27Lock = dedupeLocks(configPath, persistTo).find(
    (row) => row.subject_key === w27Key
  );
  assert.ok(beforeW27Lock);
  const w27Redelivery = await postPayload(running.baseUrl, {
    events: [lineTextEvent("W27", "M27", "HY-VVVVVVVVVV", canonicalEventTimestamp, "line-user-redelivery", "user", true)],
  });
  assertStatus(w27Redelivery, 200, "W27 redelivery");
  assertBodyStatus(w27Redelivery, "duplicate", "W27 redelivery");
  assert.deepEqual(counts(configPath, persistTo), beforeW27Redelivery);
  const afterW27Lock = dedupeLocks(configPath, persistTo).find(
    (row) => row.subject_key === w27Key
  );
  assert.deepEqual(afterW27Lock, beforeW27Lock);

  const beforeW28 = counts(configPath, persistTo);
  const beforeW28Shadow = shadowRows(configPath, persistTo).length;
  const w28Payload = {
    events: [
      lineTextEvent(
        "W28",
        "M28",
        "冷氣不冷，明天下午可以來鳳山估價嗎？請聯絡 0912-345-678",
        canonicalEventTimestamp,
        "line-user-message-asset"
      ),
    ],
  };
  const w28 = await postPayload(running.baseUrl, w28Payload);
  assertStatus(w28, 200, "W28 Message Asset-like direct LINE");
  assertBodyStatus(w28, "ignored", "W28 Message Asset-like direct LINE");
  const afterW28 = counts(configPath, persistTo);
  assert.equal(afterW28.lineEvents, beforeW28.lineEvents + 1);
  assert.equal(afterW28.outbox, beforeW28.outbox);
  const w28Event = lineEvents(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W28"
  );
  assert.equal(w28Event.match_status, "UNMATCHED");
  const w28Shadow = shadowRows(configPath, persistTo).find(
    (row) => row.webhook_event_id === "W28"
  );
  assert.equal(w28Shadow?.attribution_lane, "USER_DATA_ONLY");
  assert.equal(w28Shadow?.service_signal, 1);
  assert.equal(w28Shadow?.transaction_intent_signal, 1);
  assert.equal(w28Shadow?.location_signal, 1);
  assert.equal(w28Shadow?.schedule_signal, 1);
  assert.equal(w28Shadow?.contact_signal, 1);
  assert.equal(w28Shadow?.qualified_candidate, 1);
  const w28Identifiers = identifierRows(configPath, persistTo).filter(
    (row) => row.source_line_event_id === w28Event.line_event_id
  );
  assert.equal(w28Identifiers.length, 1);
  assert.equal(w28Identifiers[0].identifier_type, "PHONE_SHA256");
  assert.match(w28Identifiers[0].identifier_hash, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(w28Identifiers).includes("0912-345-678"), false);

  const w28Redelivery = await postPayload(running.baseUrl, {
    events: [
      lineTextEvent(
        "W28",
        "M28",
        "冷氣不冷，明天下午可以來鳳山估價嗎？請聯絡 0912-345-678",
        canonicalEventTimestamp,
        "line-user-message-asset",
        "user",
        true
      ),
    ],
  });
  assertStatus(w28Redelivery, 200, "W28 redelivery");
  assertBodyStatus(w28Redelivery, "duplicate", "W28 redelivery");
  assert.equal(shadowRows(configPath, persistTo).length, beforeW28Shadow + 1);
  assert.equal(counts(configPath, persistTo).outbox, beforeW28.outbox);

  const persistedIdentityValues = [
    ...lineEvents(configPath, persistTo).map((row) => row.line_user_key),
    ...businessRows(configPath, persistTo).map((row) => row.subject_key),
    ...tokenClaims(configPath, persistTo).map((row) => row.claimant_key),
  ].filter(Boolean);
  assert.equal(persistedIdentityValues.some((value) => String(value).startsWith("line-user-")), false);
  assert.equal(persistedIdentityValues.every((value) => /^lu_v1_[A-Za-z0-9_-]{43}$/.test(String(value))), true);

  const queryPlans = [
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT lead_token FROM lead_tokens WHERE lead_token = 'HY-AAAAAAAAAA';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT line_event_id FROM line_events WHERE webhook_event_id = 'W6';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT line_event_id FROM line_events WHERE message_id = 'M6';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT conversion_id FROM conversion_outbox WHERE lead_token = 'HY-AAAAAAAAAA' AND conversion_type = 'verified_line_contact';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT conversion_id FROM conversion_outbox WHERE status = 'pending';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT conversion_id FROM conversion_outbox WHERE next_retry_at <= '2026-08-26T00:00:00.000Z';"
    )[0].results,
    execute(
      configPath,
      persistTo,
      "EXPLAIN QUERY PLAN SELECT session_id FROM attribution_sessions WHERE session_id = 'session-last';"
    )[0].results,
  ];
  const planDetails = queryPlans.flat().map((row) => String(row.detail || ""));
  assert.equal(planDetails.every((detail) => /SEARCH/i.test(detail)), true);

  await stopServer(server);
  server = null;

  const missingRuntime = makeRuntime(
    migrationRoots.v3Root,
    persistTo,
    8792,
    false
  );
  const missing = await startServer(missingRuntime);
  missingSecretServer = missing.server;
  const beforeW21 = counts(configPath, persistTo);
  const w21 = await postPayload(missing.baseUrl, {
    events: [lineTextEvent("W21", "M21", "HY-AAAAAAAAAA")],
  });
  assertStatus(w21, 503, "W21");
  assert.equal(w21.body?.error, "WEBHOOK_NOT_CONFIGURED");
  assert.deepEqual(counts(configPath, persistTo), beforeW21);
  await stopServer(missingSecretServer);
  missingSecretServer = null;

  const finalCounts = counts(configPath, persistTo);
  const finalEvents = lineEvents(configPath, persistTo);
  const finalOutbox = outboxRows(configPath, persistTo);
  assert.equal(finalOutbox.every((row) => row.status === "pending"), true);
  assert.equal(
    finalOutbox.every((row) => row.transaction_id && row.destination_key === "HY_VERIFIED_LINE_CONTACT"),
    true
  );
  assert.equal(finalEvents.some((row) => row.match_status === "MATCHED_ADS"), true);
  assert.equal(finalEvents.some((row) => row.match_status === "MATCHED_UNATTRIBUTED"), true);
  assert.equal(finalEvents.some((row) => row.match_status === "UNMATCHED"), true);
  assert.equal(finalEvents.some((row) => row.match_status === "WRONG_CHANNEL"), true);
  assert.equal(finalEvents.some((row) => row.match_status === "AMBIGUOUS"), true);
  assert.equal(finalEvents.some((row) => row.match_status === "IGNORED_NON_TEXT"), true);

  console.log(
    JSON.stringify({
      status: "PASS",
      migration: "0001 -> existing data -> 0002 -> existing data -> 0003 -> 0008 PASS",
      tests: "W1-W27 PASS",
      http: "POST /api/line/webhook local Pages + local D1 PASS",
      d1_counts: finalCounts,
      query_plan_index_audit: "PASS",
      secrets: "dummy test secret only; no production secret",
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (server) console.error("server_tail=" + (server.output || []).join("").slice(-3000));
  process.exitCode = 1;
} finally {
  await stopServer(server);
  await stopServer(missingSecretServer);
}
