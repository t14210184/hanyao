import assert from "node:assert/strict";
import { existsSync, mkdtempSync, symlinkSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const runtimeDir = mkdtempSync(join(tmpdir(), "line4c-retention-runtime-"));
const persistTo = mkdtempSync(join(tmpdir(), "line4c-retention-d1-"));
const port = 8796;
const baseUrl = `http://127.0.0.1:${port}`;
const configPath = join(runtimeDir, "wrangler.jsonc");
const workerPath = join(runtimeDir, "worker.ts");

symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");
symlinkSync(join(cwd, "workers"), join(runtimeDir, "workers"), "dir");

writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: "line4c-retention-local",
      compatibility_date: "2026-08-27",
      main: "./worker.ts",
      d1_databases: [
        {
          binding: "ATTRIBUTION_DB",
          database_name: "line4c-retention-local-only",
          database_id: "00000000-0000-0000-0000-000000000004",
          preview_database_id: "line4c-retention-local",
          migrations_dir: "./migrations",
        },
      ],
    },
    null,
    2
  )
);

writeFileSync(
  workerPath,
  `import { cleanupExpiredLeadTokens } from "./functions/_lib/attribution.ts";
import { computeTerminalRetentionCutoff } from "./workers/google-ads-uploader/src/config.ts";
import { D1OutboxRepository } from "./workers/google-ads-uploader/src/repository.ts";

const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const fixedNow = "2026-08-28T04:00:00.000Z";
    const retentionDays = 90;
    const cutoff = computeTerminalRetentionCutoff(new Date(fixedNow), retentionDays);
    if (path === "/cutoff") {
      return response({ fixedNow, retentionDays, cutoff });
    }
    if (path === "/seed") {
      const old = new Date(Date.parse(cutoff) - 1_000).toISOString();
      const exact = cutoff;
      const newer = new Date(Date.parse(cutoff) + 1).toISOString();
      const recent = "2026-08-28T12:00:00.000Z";
      const future = "2026-09-01T00:00:00.000Z";
      const statements = [
        env.ATTRIBUTION_DB.prepare("INSERT INTO attribution_sessions (session_id, schema_version, server_created_at, server_updated_at, expires_at) VALUES (?, 1, ?, ?, ?)").bind("active-session", recent, recent, future),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-OLDNULL01", "old-null", null, "line", "issued", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-OLDNULL02", "old-null-2", null, "line", "issued", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-ACTIVE001", "old-active", "active-session", "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-PENDING01", "old-pending", null, "line", "issued", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-TERMINAL01", "old-terminal", null, "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-TERMINAL02", "exact-terminal", null, "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-TERMINAL03", "new-terminal", null, "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-TERMINAL04", "overflow-terminal", null, "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-SUBMITTED01", "submitted-terminal", null, "line", "received", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-RECENT001", "recent-null", null, "line", "issued", recent),
        env.ATTRIBUTION_DB.prepare("INSERT INTO lead_tokens (lead_token, request_id, session_id, channel, status, server_created_at) VALUES (?, ?, ?, ?, ?, ?)").bind("HY-UNKNOWN01", "old-unknown", null, "line", "future_status", old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO line_events (line_event_id, webhook_event_id, message_id, lead_token, event_type, match_status, line_event_timestamp, received_at, created_at, line_user_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)").bind("line-event-old", "webhook-old", "message-old", "HY-OLDNULL01", "message", "MATCHED_UNATTRIBUTED", old, old, old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("pending-conversion", "HY-PENDING01", "verified_line_contact", old, "tx-pending", "HY_VERIFIED_LINE_CONTACT", "pending", old, old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("terminal-old", "HY-TERMINAL01", "verified_line_contact", old, "tx-old", "HY_VERIFIED_LINE_CONTACT", "success", old, old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("terminal-exact", "HY-TERMINAL02", "verified_line_contact", exact, "tx-exact", "HY_VERIFIED_LINE_CONTACT", "failed", exact, exact),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("terminal-new", "HY-TERMINAL03", "verified_line_contact", newer, "tx-new", "HY_VERIFIED_LINE_CONTACT", "failed", newer, newer),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("terminal-overflow", "HY-TERMINAL04", "verified_line_contact", exact, "tx-overflow", "HY_VERIFIED_LINE_CONTACT", "deduplicated", exact, exact),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("processing-conversion", "HY-ACTIVE001", "verified_line_contact", old, "tx-processing", "HY_VERIFIED_LINE_CONTACT", "processing", old, old),
        env.ATTRIBUTION_DB.prepare("INSERT INTO conversion_outbox (conversion_id, lead_token, conversion_type, event_timestamp, transaction_id, destination_key, status, retry_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind("submitted-conversion", "HY-SUBMITTED01", "verified_line_contact", old, "tx-submitted", "HY_VERIFIED_LINE_CONTACT", "submitted", old, old),
      ];
      for (const [index, statement] of statements.entries()) {
        try {
          await statement.run();
        } catch (error) {
          throw new Error("seed statement " + index + " failed: " + (error instanceof Error ? error.message : error));
        }
      }
      return response({ seeded: true });
    }
    if (path === "/cleanup-leads") {
      const deleted = await cleanupExpiredLeadTokens(
        env.ATTRIBUTION_DB,
        new Date("2026-08-28T00:00:00.000Z"),
        2
      );
      return response({ deleted });
    }
    if (path === "/cleanup-outbox") {
      const rollingCutoff = computeTerminalRetentionCutoff(new Date(fixedNow), retentionDays);
      const deleted = await new D1OutboxRepository(env.ATTRIBUTION_DB)
        .cleanupTerminalRows(rollingCutoff, 2);
      return response({ deleted, cutoff: rollingCutoff, limit: 2 });
    }
    if (path === "/readback") {
      const leads = await env.ATTRIBUTION_DB.prepare("SELECT lead_token, session_id, status FROM lead_tokens ORDER BY lead_token").all();
      const outbox = await env.ATTRIBUTION_DB.prepare("SELECT conversion_id, status FROM conversion_outbox ORDER BY conversion_id").all();
      const events = await env.ATTRIBUTION_DB.prepare("SELECT lead_token FROM line_events WHERE line_event_id = 'line-event-old'").all();
      return response({ leads: leads.results, outbox: outbox.results, events: events.results });
    }
    return response({ error: "NOT_FOUND" }, 404);
  },
};
`,
  "utf8"
);

const run = (args: string[]) => {
  const result = spawnSync(wrangler, args, {
    cwd: runtimeDir,
    encoding: "utf8",
    env: { ...process.env, NO_D1_WARNING: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
};

const serverOutput: string[] = [];
let server: ReturnType<typeof spawn> | undefined;

const getJson = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  assert.match(
    response.headers.get("content-type") || "",
    /application\/json/i,
    `${path} did not reach the local Worker route`
  );
  return JSON.parse(text);
};

try {
  assert.equal(existsSync(wrangler), true, "WRANGLER_LOCAL_BINARY_NOT_FOUND");
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
  server = spawn(
    wrangler,
    [
      "dev",
      "--local",
      "--persist-to",
      persistTo,
      "--config",
      configPath,
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--log-level",
      "error",
    ],
    {
      cwd: runtimeDir,
      env: { ...process.env, NO_D1_WARNING: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  server.stdout?.on("data", (chunk) => serverOutput.push(String(chunk)));
  server.stderr?.on("data", (chunk) => serverOutput.push(String(chunk)));

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) {
      throw new Error(`local Worker exited: ${server.exitCode}\n${serverOutput.join("")}`);
    }
    try {
      const response = await fetch(`${baseUrl}/readback`);
      if (response.ok && /application\/json/i.test(response.headers.get("content-type") || "")) break;
    } catch {
      // Keep waiting for the local Worker.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  assert.deepEqual(await getJson("/cutoff"), {
    fixedNow: "2026-08-28T04:00:00.000Z",
    retentionDays: 90,
    cutoff: "2026-05-30T04:00:00.000Z",
  });
  assert.deepEqual(await getJson("/seed"), { seeded: true });
  // D1 changes include the ON DELETE SET NULL update on line_events.
  assert.deepEqual(await getJson("/cleanup-leads"), { deleted: 3 });
  assert.deepEqual(await getJson("/cleanup-outbox"), {
    deleted: 2,
    cutoff: "2026-05-30T04:00:00.000Z",
    limit: 2,
  });
  assert.deepEqual(await getJson("/cleanup-leads"), { deleted: 2 });
  const readback = await getJson("/readback");
  assert.deepEqual(readback.leads, [
    { lead_token: "HY-ACTIVE001", session_id: "active-session", status: "received" },
    { lead_token: "HY-PENDING01", session_id: null, status: "issued" },
    { lead_token: "HY-RECENT001", session_id: null, status: "issued" },
    { lead_token: "HY-SUBMITTED01", session_id: null, status: "received" },
    { lead_token: "HY-TERMINAL03", session_id: null, status: "received" },
    { lead_token: "HY-TERMINAL04", session_id: null, status: "received" },
    { lead_token: "HY-UNKNOWN01", session_id: null, status: "future_status" },
  ]);
  assert.deepEqual(readback.outbox, [
    { conversion_id: "pending-conversion", status: "pending" },
    { conversion_id: "processing-conversion", status: "processing" },
    { conversion_id: "submitted-conversion", status: "submitted" },
    { conversion_id: "terminal-new", status: "failed" },
    { conversion_id: "terminal-overflow", status: "deduplicated" },
  ]);
  assert.deepEqual(readback.events, [{ lead_token: null }]);
  console.log(JSON.stringify({
    status: "PASS",
    localD1: true,
    leadTokenCleanup: "bounded + expired + no-session/no-outbox guards",
    outboxCleanup: "bounded + rolling 90-day cutoff + terminal-status guard",
    foreignKeyReadback: "line_events.lead_token set NULL",
    remoteCalls: "NONE",
  }));
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : error);
  if (serverOutput.length > 0) console.error(serverOutput.join(""));
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
  }
  rmSync(runtimeDir, { recursive: true, force: true });
  rmSync(persistTo, { recursive: true, force: true });
}
