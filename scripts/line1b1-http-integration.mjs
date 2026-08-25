import assert from "node:assert/strict";
import { readFileSync, symlinkSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const persistTo = mkdtempSync(join(tmpdir(), "line1b1-pages-d1-"));
const runtimeDir = mkdtempSync(join(tmpdir(), "line1b1-pages-runtime-"));
symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");

const configPath = join(runtimeDir, "wrangler.jsonc");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: "hanyao-line1b1-local-runtime",
      compatibility_date: "2026-08-25",
      pages_build_output_dir: "./out",
      d1_databases: [
        {
          binding: "ATTRIBUTION_DB",
          database_name: "hanyao-attribution-line1b1-local",
          database_id: "LINE1B1_LOCAL_ONLY_NO_PRODUCTION_ID",
          preview_database_id: "line1b1-local-attribution",
          migrations_dir: "./migrations",
        },
      ],
    },
    null,
    2
  )
);

const port = 8793;
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

const responseHeaders = (response) => ({
  cacheControl: response.headers.get("Cache-Control"),
  contentType: response.headers.get("Content-Type"),
});

const post = async (path, payload, requestOrigin = origin) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
  return {
    status: response.status,
    body: await parseJson(response),
    headers: responseHeaders(response),
  };
};

const touch = ({
  gclid = null,
  gbraid = null,
  wbraid = null,
  capturedAt = "2026-08-25T00:00:00.000Z",
  utm = {},
} = {}) => {
  const query = new URLSearchParams();
  if (gclid) query.set("gclid", gclid);
  if (gbraid) query.set("gbraid", gbraid);
  if (wbraid) query.set("wbraid", wbraid);
  for (const [key, value] of Object.entries(utm)) query.set(key, value);
  return {
    captured_at: capturedAt,
    landing_url: `https://www.xusen.pro/?${query.toString()}`,
    referrer: "https://www.google.com/search?q=line-prepare",
    gclid,
    gbraid,
    wbraid,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_id: utm.utm_id ?? null,
    utm_term: utm.utm_term ?? null,
    utm_content: utm.utm_content ?? null,
  };
};

const sessionPayload = (sessionId, firstTouch, lastTouch = firstTouch) => ({
  schema_version: 1,
  session_id: sessionId,
  stored_at: "2026-08-25T00:00:00.000Z",
  first_touch: firstTouch,
  last_touch: lastTouch,
});

const requestId = (number) =>
  `${number.toString(16).padStart(8, "0")}-1111-4111-8111-111111111111`;

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

const readD1Json = (command) =>
  JSON.parse(
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
      command,
    ])
  );

const counts = () => {
  const results = readD1Json(
    "SELECT COUNT(*) AS count FROM attribution_sessions; SELECT COUNT(*) AS count FROM lead_tokens;"
  );
  return {
    sessions: Number(results[0].results[0].count),
    leads: Number(results[1].results[0].count),
  };
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

  const p1 = await post("/api/line/prepare", {
    request_id: requestId(1),
    attribution: sessionPayload(
      "p1-gclid",
      touch({
        gclid: "P1-GCLID",
        utm: { utm_source: "google", utm_medium: "cpc" },
      })
    ),
  });
  assertStatus(p1, 200, "P1 gclid");
  assert.deepEqual(Object.keys(p1.body).sort(), ["lead_token", "status"]);
  assert.deepEqual(Object.keys(p1.body), ["status", "lead_token"]);
  assert.equal(p1.body.status, "prepared");
  assert.match(p1.body.lead_token, /^HY-[A-Z2-9_]{10}$/);
  assert.equal(p1.headers.cacheControl, "no-store");
  assert.equal("session_id" in p1.body, false);
  assert.equal("gclid" in p1.body, false);

  const p2 = await post("/api/line/prepare", {
    request_id: requestId(2),
    attribution: sessionPayload("p2-gbraid", touch({ gbraid: "P2-GBRAID" })),
  });
  assertStatus(p2, 200, "P2 gbraid");
  const p3 = await post("/api/line/prepare", {
    request_id: requestId(3),
    attribution: sessionPayload("p3-wbraid", touch({ wbraid: "P3-WBRAID" })),
  });
  assertStatus(p3, 200, "P3 wbraid");

  const p4 = await post("/api/line/prepare", {
    request_id: requestId(4),
    attribution: null,
  });
  assertStatus(p4, 200, "P4 null attribution");
  assert.match(p4.body.lead_token, /^HY-[A-Z2-9_]{10}$/);

  const retryPayload = {
    request_id: requestId(5),
    attribution: sessionPayload("p5-retry", touch({ gclid: "P5-GCLID" })),
  };
  const p5First = await post("/api/line/prepare", retryPayload);
  const p5Retry = await post("/api/line/prepare", retryPayload);
  assertStatus(p5First, 200, "P5 first");
  assertStatus(p5Retry, 200, "P5 retry");
  assert.equal(p5Retry.body.lead_token, p5First.body.lead_token);

  const p6Before = counts();
  const p6 = await post("/api/line/prepare", {
    request_id: retryPayload.request_id,
    attribution: sessionPayload("p6-different-session", touch({ gclid: "P6-GCLID" })),
  });
  const p6After = counts();
  assertStatus(p6, 409, "P6 different session");
  assert.deepEqual(p6.body, { error: "IDEMPOTENCY_CONFLICT" });
  assert.equal(p6After.leads, p6Before.leads);
  assert.equal(p6After.sessions, p6Before.sessions + 1);

  const p7Request = requestId(7);
  const p7Phone = await post("/api/attribution/v1/lead-token", {
    request_id: p7Request,
    session_id: null,
    channel: "phone",
  });
  assertStatus(p7Phone, 200, "P7 seed phone");
  const p7 = await post("/api/line/prepare", {
    request_id: p7Request,
    attribution: null,
  });
  assertStatus(p7, 409, "P7 phone then line");
  assert.deepEqual(p7.body, { error: "IDEMPOTENCY_CONFLICT" });

  const p8Before = counts();
  const p8 = await post("/api/line/prepare", {
    request_id: requestId(8),
    attribution: null,
    phone: "08-7552260",
  });
  const p8After = counts();
  assertStatus(p8, 400, "P8 top-level PII");
  assert.deepEqual(p8.body, { error: "UNSUPPORTED_FIELD" });
  assert.deepEqual(p8After, p8Before);

  const invalidNested = sessionPayload(
    "p9-invalid",
    touch({ gclid: "P9-GCLID" })
  );
  invalidNested.first_touch.message = "must not be accepted";
  const p9Before = counts();
  const p9 = await post("/api/line/prepare", {
    request_id: requestId(9),
    attribution: invalidNested,
  });
  const p9After = counts();
  assertStatus(p9, 400, "P9 invalid attribution");
  assert.deepEqual(p9.body, { error: "UNSUPPORTED_FIELD" });
  assert.deepEqual(p9After, p9Before);

  const p10Before = counts();
  const p10 = await post(
    "/api/line/prepare",
    {
      request_id: requestId(10),
      attribution: sessionPayload("p10-origin", touch({ gclid: "P10-GCLID" })),
    },
    "https://evil.example"
  );
  const p10After = counts();
  assertStatus(p10, 403, "P10 wrong origin");
  assert.deepEqual(p10.body, { error: "ORIGIN_NOT_ALLOWED" });
  assert.deepEqual(p10After, p10Before);

  const p11Before = counts();
  const p11 = await post("/api/line/prepare", "x".repeat(17_000));
  const p11After = counts();
  assertStatus(p11, 413, "P11 oversized");
  assert.deepEqual(p11.body, { error: "PAYLOAD_TOO_LARGE" });
  assert.deepEqual(p11After, p11Before);

  const p12 = await post("/api/line/prepare", "{bad-json");
  assertStatus(p12, 400, "P12 malformed JSON");
  assert.deepEqual(p12.body, { error: "INVALID_JSON" });
  assert.equal(p12.headers.cacheControl, "no-store");

  const p13Payload = {
    request_id: requestId(13),
    attribution: sessionPayload("p13-concurrent", touch({ gclid: "P13-GCLID" })),
  };
  const p13Results = await Promise.all(
    Array.from({ length: 10 }, () => post("/api/line/prepare", p13Payload))
  );
  assert.equal(p13Results.every((result) => result.status === 200), true);
  assert.equal(new Set(p13Results.map((result) => result.body.lead_token)).size, 1);
  assert.equal(new Set(p13Results.map((result) => result.body.status)).size, 1);

  const p14First = touch({
    gclid: "P14-FIRST",
    capturedAt: "2026-08-25T14:00:00.000Z",
  });
  const p14Last = touch({
    gclid: "P14-LAST",
    capturedAt: "2026-08-25T14:01:00.000Z",
  });
  assertStatus(
    await post("/api/line/prepare", {
      request_id: requestId(14),
      attribution: sessionPayload("p14-first-preserved", p14First),
    }),
    200,
    "P14 first seed"
  );
  assertStatus(
    await post("/api/line/prepare", {
      request_id: requestId(15),
      attribution: sessionPayload(
        "p14-first-preserved",
        touch({ gclid: "P14-DO-NOT-OVERWRITE", capturedAt: p14Last.captured_at }),
        p14Last
      ),
    }),
    200,
    "P14 newer last"
  );

  const p15New = touch({
    gclid: "P15-NEW",
    capturedAt: "2026-08-25T15:10:00.000Z",
  });
  const p15Stale = touch({
    gclid: "P15-STALE",
    capturedAt: "2026-08-25T15:05:00.000Z",
  });
  assertStatus(
    await post("/api/line/prepare", {
      request_id: requestId(16),
      attribution: sessionPayload("p15-last-order", p15New),
    }),
    200,
    "P15 newer seed"
  );
  assertStatus(
    await post("/api/line/prepare", {
      request_id: requestId(17),
      attribution: sessionPayload(
        "p15-last-order",
        touch({ gclid: "P15-FIRST-STALE", capturedAt: p15Stale.captured_at }),
        p15Stale
      ),
    }),
    200,
    "P15 stale retry"
  );

  const methodResponse = await fetch(`${baseUrl}/api/line/prepare`, {
    headers: { Origin: origin },
  });
  assert.equal(methodResponse.status, 405, "only POST is allowed");
  assert.equal(methodResponse.headers.get("Cache-Control"), "no-store");

  const source = readFileSync(join(cwd, "functions/api/line/prepare.ts"), "utf8");
  assert.equal(/\bfetch\s*\(/.test(source), false, "P17 route must not call providers");
  assert.equal(source.includes("LINE_CHANNEL_SECRET"), false);
  assert.equal(source.includes("google"), false);

  const directReadback = readD1Json(
    "SELECT session_id, first_gclid, first_gbraid, first_wbraid, last_gclid, last_captured_at, server_created_at, expires_at FROM attribution_sessions ORDER BY session_id; SELECT lead_token, request_id, session_id, channel, status FROM lead_tokens ORDER BY request_id;"
  );
  const sessions = directReadback[0].results;
  const leads = directReadback[1].results;
  assert.equal(sessions.length, 8);
  assert.equal(leads.length, 11);

  const row = (id) => sessions.find((item) => item.session_id === id);
  assert.equal(row("p1-gclid").first_gclid, "P1-GCLID");
  assert.equal(row("p2-gbraid").first_gbraid, "P2-GBRAID");
  assert.equal(row("p3-wbraid").first_wbraid, "P3-WBRAID");
  assert.equal(row("p5-retry").first_gclid, "P5-GCLID");
  assert.equal(row("p14-first-preserved").first_gclid, "P14-FIRST");
  assert.equal(row("p14-first-preserved").last_gclid, "P14-LAST");
  assert.equal(row("p15-last-order").last_gclid, "P15-NEW");
  assert.equal(row("p15-last-order").last_captured_at, p15New.captured_at);
  assert.equal(leads.filter((item) => item.request_id === requestId(5)).length, 1);
  assert.equal(leads.filter((item) => item.request_id === requestId(13)).length, 1);
  assert.equal(leads.filter((item) => item.session_id === null).length, 2);
  assert.equal(leads.filter((item) => item.channel === "phone").length, 1);
  assert.equal(leads.every((item) => item.channel === "line" || item.channel === "phone"), true);
  assert.equal(leads.some((item) => item.request_id === requestId(7) && item.channel === "line"), false);

  console.log(
    JSON.stringify({
      status: "PASS",
      server: baseUrl,
      migrations: "0001 -> 0002 -> 0003",
      p_cases: "P1-P17 PASS",
      idempotency: "same request/session/channel returns same token; different session/channel conflicts",
      concurrency: "10 identical requests -> one token and one lead row",
      direct_d1_readback: "PASS",
      external_provider_calls: "NONE",
      sessions: sessions.length,
      lead_tokens: leads.length,
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (serverOutput.length > 0) {
    console.error(serverOutput.join("").slice(-5000));
  }
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
  }
}
