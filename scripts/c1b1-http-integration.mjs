import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const persistTo = mkdtempSync(join(tmpdir(), "c1b1-pages-d1-"));
const runtimeDir = mkdtempSync(join(tmpdir(), "c1b1-pages-runtime-"));
symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");
const configPath = join(runtimeDir, "wrangler.jsonc");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: "hanyao-c1b1-local-runtime",
      compatibility_date: "2026-08-24",
      pages_build_output_dir: "./out",
      d1_databases: [
        {
          binding: "ATTRIBUTION_DB",
          database_name: "hanyao-attribution-local",
          database_id: "C1B1_LOCAL_ONLY_NO_PRODUCTION_ID",
          preview_database_id: "c1b1-local-attribution",
          migrations_dir: "./migrations",
        },
      ],
    },
    null,
    2
  )
);
const port = 8789;
const baseUrl = `http://127.0.0.1:${port}`;
const origin = baseUrl;

const runWrangler = (args) => {
  const result = spawnSync(wrangler, args, {
    cwd: runtimeDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `Wrangler command failed: ${args.join(" ")}\n${result.stdout}\n${result.stderr}`
    );
  }
  return result.stdout;
};

const parseJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

const post = async (path, payload, requestOrigin = origin) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
  return { status: response.status, body: await parseJson(response) };
};

const touch = ({
  gclid = null,
  gbraid = null,
  wbraid = null,
  utm = {},
  capturedAt = "2026-08-24T00:00:00.000Z",
} = {}) => ({
  captured_at: capturedAt,
  landing_url: `https://www.xusen.pro/?${new URLSearchParams({
    ...(gclid ? { gclid } : {}),
    ...(gbraid ? { gbraid } : {}),
    ...(wbraid ? { wbraid } : {}),
    ...utm,
  })}`,
  referrer: "https://www.google.com/search?q=test",
  gclid,
  gbraid,
  wbraid,
  utm_source: utm.utm_source ?? null,
  utm_medium: utm.utm_medium ?? null,
  utm_campaign: utm.utm_campaign ?? null,
  utm_id: utm.utm_id ?? null,
  utm_term: utm.utm_term ?? null,
  utm_content: utm.utm_content ?? null,
});

const sessionPayload = (sessionId, firstTouch, lastTouch = firstTouch) => ({
  schema_version: 1,
  session_id: sessionId,
  stored_at: "2026-08-24T00:00:00.000Z",
  first_touch: firstTouch,
  last_touch: lastTouch,
});

const leadRequestId = (hex) => `${hex.repeat(8).slice(0, 8)}-1111-4111-8111-111111111111`;

const assertStatus = (result, status, label) => {
  assert.equal(result.status, status, `${label}: unexpected status`);
};

const waitForServer = async (server) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) {
      throw new Error(`Pages dev exited before readiness: ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status === 200) return;
    } catch {
      // Continue waiting for Wrangler's local server.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for local Pages dev server");
};

const serverOutput = [];
let server;

try {
  runWrangler([
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
      "pages",
      "dev",
      "out",
      "--local",
      "--persist-to",
      persistTo,
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--log-level",
      "error",
      "--show-interactive-dev-session=false",
    ],
    { cwd: runtimeDir, stdio: ["ignore", "pipe", "pipe"] }
  );
  server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
  server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
  await waitForServer(server);

  const first = touch({
    gclid: "G1",
    utm: { utm_source: "google", utm_medium: "cpc", utm_campaign: "repair" },
  });
  assertStatus(
    await post("/api/attribution/v1/session", sessionPayload("session-A", first)),
    200,
    "S1"
  );

  const fakeFirst = touch({ gclid: "FAKE" });
  const second = touch({
    gclid: "G2",
    capturedAt: "2026-08-24T00:01:00.000Z",
  });
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-A", fakeFirst, second)
    ),
    200,
    "S2"
  );
  for (let index = 0; index < 10; index += 1) {
    assertStatus(
      await post(
        "/api/attribution/v1/session",
        sessionPayload("session-A", fakeFirst, second)
      ),
      200,
      `S3-${index + 1}`
    );
  }

  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-B", touch({ gbraid: "GB1" }))
    ),
    200,
    "S4"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-C", touch({ wbraid: "WB1" }))
    ),
    200,
    "S5"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload(
        "session-D",
        touch({ utm: { utm_source: "newsletter", utm_medium: "email" } })
      )
    ),
    200,
    "S6"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-E", touch(), touch())
    ),
    200,
    "S7"
  );

  assertStatus(
    await post("/api/attribution/v1/session", "{bad-json"),
    400,
    "S8"
  );
  assertStatus(
    await post("/api/attribution/v1/session", "x".repeat(17_000)),
    413,
    "S9"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      { ...sessionPayload("session-pii", first), phone: "08-7552260" }
    ),
    400,
    "PII rejection"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("' OR 1=1 --", first)
    ),
    400,
    "SQL injection validation"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-origin", first),
      "https://evil.example"
    ),
    403,
    "origin protection"
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/attribution/v1/session`, {
        headers: { Origin: origin },
      })
    ).status,
    405
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/attribution/v1/lead-token`, {
        headers: { Origin: origin },
      })
    ).status,
    405
  );

  const orderFirst = touch({
    gclid: "A",
    capturedAt: "2026-08-24T10:00:00.000Z",
  });
  const orderSecond = touch({
    gclid: "B",
    capturedAt: "2026-08-24T10:10:00.000Z",
  });
  const orderStale = touch({
    gclid: "C",
    capturedAt: "2026-08-24T10:05:00.000Z",
  });
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-order", orderFirst)
    ),
    200,
    "S10-1"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-order", orderFirst, orderSecond)
    ),
    200,
    "S10-2"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload("session-order", touch({ gclid: "FIRST-STALE" }), orderStale)
    ),
    200,
    "S10-3"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload(
        "session-order",
        orderFirst,
        touch({ gclid: "NO-TIMESTAMP", capturedAt: null })
      )
    ),
    200,
    "S10-4-null-timestamp"
  );
  assertStatus(
    await post(
      "/api/attribution/v1/session",
      sessionPayload(
        "session-order",
        orderFirst,
        touch({ gclid: "SAME-TIMESTAMP", capturedAt: orderSecond.captured_at })
      )
    ),
    200,
    "S10-5-same-timestamp"
  );

  const concurrentResults = await Promise.all(
    Array.from({ length: 10 }, (_, index) => {
      const concurrentTouch = touch({
        gclid: `R${index}`,
        capturedAt: "2026-08-24T11:00:00.000Z",
      });
      return post(
        "/api/attribution/v1/session",
        sessionPayload("session-concurrent", concurrentTouch)
      );
    })
  );
  assert.equal(concurrentResults.every((result) => result.status === 200), true);
  assert.equal(
    new Set(concurrentResults.map((result) => result.body.server_created_at)).size,
    1
  );

  const requestOne = leadRequestId("a");
  const leadOne = await post("/api/attribution/v1/lead-token", {
    request_id: requestOne,
    session_id: "session-A",
    channel: "line",
  });
  assertStatus(leadOne, 200, "L1");
  assert.match(leadOne.body.lead_token, /^HY-[A-Z2-9_]{10}$/);

  const leadRetry = await post("/api/attribution/v1/lead-token", {
    request_id: requestOne,
    session_id: "session-A",
    channel: "line",
  });
  assertStatus(leadRetry, 200, "L2 retry");
  assert.equal(leadRetry.body.lead_token, leadOne.body.lead_token);

  const requestTwo = leadRequestId("b");
  const leadTwo = await post("/api/attribution/v1/lead-token", {
    request_id: requestTwo,
    session_id: "session-A",
    channel: "form",
  });
  assertStatus(leadTwo, 200, "L3");
  assert.notEqual(leadTwo.body.lead_token, leadOne.body.lead_token);

  const unattributed = await post("/api/attribution/v1/lead-token", {
    request_id: leadRequestId("c"),
    session_id: null,
    channel: "phone",
  });
  assertStatus(unattributed, 200, "L4");

  const missingSession = await post("/api/attribution/v1/lead-token", {
    request_id: leadRequestId("d"),
    session_id: "missing-session",
    channel: "phone",
  });
  assertStatus(missingSession, 404, "L5");
  assert.deepEqual(missingSession.body, { error: "SESSION_NOT_FOUND" });

  assertStatus(
    await post("/api/attribution/v1/lead-token", {
      request_id: leadRequestId("e"),
      session_id: null,
      channel: "telegram",
    }),
    400,
    "L6"
  );
  assertStatus(
    await post("/api/attribution/v1/lead-token", {
      request_id: leadRequestId("f"),
      session_id: null,
      channel: "line",
      email: "not-stored@example.com",
    }),
    400,
    "L7"
  );

  const directReadback = JSON.parse(
    runWrangler([
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
      "SELECT session_id, first_gclid, first_gbraid, first_wbraid, first_utm_source, first_landing_path, first_referrer_origin, last_gclid, last_captured_at, last_landing_path, server_created_at, server_updated_at, expires_at FROM attribution_sessions ORDER BY session_id; SELECT lead_token, request_id, session_id, channel, status FROM lead_tokens ORDER BY request_id;",
    ])
  );
  const sessions = directReadback[0].results;
  const leads = directReadback[1].results;
  assert.equal(sessions.length, 7);
  assert.equal(leads.length, 3);

  const rowA = sessions.find((row) => row.session_id === "session-A");
  assert.equal(rowA.first_gclid, "G1");
  assert.equal(rowA.last_gclid, "G2");
  assert.equal(rowA.first_landing_path.includes("?"), false);
  assert.equal(rowA.first_referrer_origin, "https://www.google.com");
  assert.equal(Date.parse(rowA.expires_at) > Date.parse(rowA.server_created_at), true);

  const rowB = sessions.find((row) => row.session_id === "session-B");
  const rowC = sessions.find((row) => row.session_id === "session-C");
  const rowD = sessions.find((row) => row.session_id === "session-D");
  const rowE = sessions.find((row) => row.session_id === "session-E");
  const rowOrder = sessions.find((row) => row.session_id === "session-order");
  const rowConcurrent = sessions.find(
    (row) => row.session_id === "session-concurrent"
  );
  assert.equal(rowB.first_gbraid, "GB1");
  assert.equal(rowC.first_wbraid, "WB1");
  assert.equal(rowD.first_utm_source, "newsletter");
  assert.equal(rowE.first_gclid, null);
  assert.equal(rowE.last_gclid, null);
  assert.equal(rowOrder.first_gclid, "A");
  assert.equal(rowOrder.last_gclid, "B");
  assert.equal(rowOrder.last_captured_at, orderSecond.captured_at);
  assert.match(rowConcurrent.first_gclid, /^R[0-9]$/);
  assert.equal(
    sessions.filter((row) => row.session_id === "session-concurrent").length,
    1
  );
  assert.equal(leads.filter((row) => row.request_id === requestOne).length, 1);
  assert.equal(leads.filter((row) => row.session_id === null).length, 1);
  assert.equal(leads.every((row) => ["line", "phone", "form"].includes(row.channel)), true);

  console.log(
    JSON.stringify({
      status: "PASS",
      server: baseUrl,
      migration_state: persistTo,
      sessions: sessions.length,
      lead_tokens: leads.length,
      session_cases: "S1-S11 PASS",
      lead_cases: "L1-L7 PASS",
      direct_d1_readback: "PASS",
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (serverOutput.length > 0) {
    console.error(serverOutput.join("").slice(-3000));
  }
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
  }
}
