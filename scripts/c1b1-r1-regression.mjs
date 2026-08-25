import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const placeholder = "C1B1_LOCAL_ONLY_NO_PRODUCTION_ID";

const run = (args, runCwd = cwd) => {
  const result = spawnSync(wrangler, args, {
    cwd: runCwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `Wrangler failed: ${args.join(" ")}\n${result.stdout}\n${result.stderr}`
    );
  }
  return result.stdout;
};

const writeConfig = (configRoot, migrationDir, pagesBuildOutputDir = null) => {
  mkdirSync(join(configRoot, "migrations"), { recursive: true });
  const configPath = join(configRoot, "wrangler.jsonc");
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        name: "hanyao-c1b1-r1-local",
        compatibility_date: "2026-08-24",
        ...(pagesBuildOutputDir
          ? { pages_build_output_dir: pagesBuildOutputDir }
          : {}),
        d1_databases: [
          {
            binding: "ATTRIBUTION_DB",
            database_name: "hanyao-attribution-local",
            database_id: placeholder,
            preview_database_id: "c1b1-local-attribution",
            migrations_dir: migrationDir,
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

const apply = (configPath, persistTo) =>
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

const stableCleanupSample = (value) =>
  Array.from(value).reduce((sum, character) => (sum + character.codePointAt(0)) % 16, 0);

const cleanupTrigger = Array.from({ length: 100 }, (_, index) => `cleanup-trigger-${index}`).find(
  (candidate) => stableCleanupSample(candidate) === 0
);
assert.ok(cleanupTrigger);

const post = async (baseUrl, sessionId) => {
  const emptyTouch = {
    captured_at: "2026-08-25T00:00:00.000Z",
    landing_url: "https://www.xusen.pro/",
    referrer: null,
    gclid: null,
    gbraid: null,
    wbraid: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_id: null,
    utm_term: null,
    utm_content: null,
  };
  const response = await fetch(`${baseUrl}/api/attribution/v1/session`, {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({
      schema_version: 1,
      session_id: sessionId,
      first_touch: emptyTouch,
      last_touch: emptyTouch,
    }),
  });
  return { status: response.status, body: await response.json() };
};

const waitForServer = async (server, baseUrl) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) throw new Error("Pages dev exited early");
    try {
      if ((await fetch(`${baseUrl}/`)).status === 200) return;
    } catch {
      // Keep waiting for local Pages dev.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for local Pages dev");
};

let server;
try {
  const migrationRoot = mkdtempSync(join(tmpdir(), "c1b1-r1-migrations-"));
  const v1Root = join(migrationRoot, "v1");
  const v2Root = join(migrationRoot, "v2");
  mkdirSync(join(v1Root, "migrations"), { recursive: true });
  mkdirSync(join(v2Root, "migrations"), { recursive: true });
  copyFileSync(
    join(cwd, "migrations/0001_attribution_v1.sql"),
    join(v1Root, "migrations/0001_attribution_v1.sql")
  );
  copyFileSync(
    join(cwd, "migrations/0001_attribution_v1.sql"),
    join(v2Root, "migrations/0001_attribution_v1.sql")
  );
  copyFileSync(
    join(cwd, "migrations/0002_attribution_retention_integrity.sql"),
    join(v2Root, "migrations/0002_attribution_retention_integrity.sql")
  );

  const v1Config = writeConfig(v1Root, "./migrations");
  const v2Config = writeConfig(v2Root, "./migrations");
  const persistTo = mkdtempSync(join(tmpdir(), "c1b1-r1-d1-"));

  apply(v1Config, persistTo);
  execute(
    v1Config,
    persistTo,
    `INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at)
     VALUES ('legacy-expired', 1, '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'),
            ('legacy-active', 1, '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z');
     INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at)
     VALUES ('HY-LEGACY0001', 'legacy-request-1', 'legacy-expired', 'form', 'issued', '2026-08-01T00:00:00.000Z');`
  );
  apply(v2Config, persistTo);

  const migratedSchema = execute(
    v2Config,
    persistTo,
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'lead_tokens';"
  )[0].results[0].sql;
  assert.match(migratedSchema, /ON DELETE SET NULL/i);
  const migratedRows = execute(
    v2Config,
    persistTo,
    "SELECT session_id FROM attribution_sessions ORDER BY session_id; SELECT lead_token, session_id FROM lead_tokens;"
  );
  assert.deepEqual(
    migratedRows[0].results.map((row) => row.session_id),
    ["legacy-active", "legacy-expired"]
  );
  assert.equal(migratedRows[1].results[0].session_id, "legacy-expired");

  execute(
    v2Config,
    persistTo,
    "DELETE FROM attribution_sessions WHERE session_id = 'legacy-expired';"
  );
  const fkReadback = execute(
    v2Config,
    persistTo,
    "SELECT session_id FROM attribution_sessions ORDER BY session_id; SELECT lead_token, session_id FROM lead_tokens;"
  );
  assert.deepEqual(
    fkReadback[0].results.map((row) => row.session_id),
    ["legacy-active"]
  );
  assert.equal(fkReadback[1].results.length, 1);
  assert.equal(fkReadback[1].results[0].session_id, null);

  execute(
    v2Config,
    persistTo,
    `INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at)
     VALUES ('cleanup-expired', 1, '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'),
            ('cleanup-active', 1, '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z');
     INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at)
     VALUES ('HY-CLEANUP01', 'cleanup-request-1', 'cleanup-expired', 'line', 'issued', '2026-08-01T00:00:00.000Z');`
  );

  const runtimeDir = mkdtempSync(join(tmpdir(), "c1b1-r1-pages-runtime-"));
  symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
  symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
  symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");
  writeConfig(runtimeDir, "./migrations", "./out");
  const baseUrl = "http://127.0.0.1:8790";
  server = spawn(
    wrangler,
    [
      "pages",
      "dev",
      "out",
      "--local",
      "--persist-to",
      persistTo,
      "--ip",
      "127.0.0.1",
      "--port",
      "8790",
      "--log-level",
      "error",
      "--show-interactive-dev-session=false",
    ],
    { cwd: runtimeDir, stdio: ["ignore", "pipe", "pipe"] }
  );
  const serverOutput = [];
  server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
  server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
  await waitForServer(server, baseUrl);
  const cleanupResponse = await post(baseUrl, cleanupTrigger);
  assert.equal(cleanupResponse.status, 200);

  const cleanupRows = execute(
    v2Config,
    persistTo,
    "SELECT session_id FROM attribution_sessions ORDER BY session_id; SELECT lead_token, session_id FROM lead_tokens WHERE lead_token = 'HY-CLEANUP01';"
  );
  assert.equal(
    cleanupRows[0].results.some((row) => row.session_id === "cleanup-expired"),
    false
  );
  assert.equal(
    cleanupRows[0].results.some((row) => row.session_id === "cleanup-active"),
    true
  );
  assert.equal(cleanupRows[1].results[0].session_id, null);

  const configCheck = spawnSync(
    process.execPath,
    ["scripts/c1b1-config-safety.mjs"],
    { cwd, encoding: "utf8" }
  );
  assert.equal(configCheck.status, 0, configCheck.stderr);
  const unsafeConfig = join(migrationRoot, "unsafe-wrangler.jsonc");
  writeFileSync(
    unsafeConfig,
    JSON.stringify({ database_id: placeholder, ATTRIBUTION_DB: true })
  );
  const remoteCheck = spawnSync(
    process.execPath,
    ["scripts/c1b1-config-safety.mjs", "--remote", "--config", unsafeConfig],
    { cwd, encoding: "utf8" }
  );
  assert.notEqual(remoteCheck.status, 0);

  console.log(
    JSON.stringify({
      status: "PASS",
      migration: "0001-existing-data-to-0002 PASS",
      fk_set_null: "PASS",
      cleanup: "expired session deleted; active retained; lead token retained with null session_id",
      config_safety: "PASS",
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) server.kill("SIGTERM");
}
