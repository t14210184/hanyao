import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { prepareLineLead } from "../src/lib/line-contact.ts";

const cwd = process.cwd();
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const persistTo = mkdtempSync(join(tmpdir(), "line1b2a-local-d1-"));
const runtimeDir = mkdtempSync(join(tmpdir(), "line1b2a-local-runtime-"));
symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");

const configPath = join(runtimeDir, "wrangler.jsonc");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: "hanyao-line1b2a-local-runtime",
      compatibility_date: "2026-08-25",
      pages_build_output_dir: "./out",
      d1_databases: [
        {
          binding: "ATTRIBUTION_DB",
          database_name: "hanyao-line1b2a-local",
          database_id: "LINE1B2A_LOCAL_ONLY_NO_PRODUCTION_ID",
          preview_database_id: "line1b2a-local-attribution",
          migrations_dir: "./migrations",
        },
      ],
    },
    null,
    2
  )
);

const runWrangler = (args: string[]) => {
  const result = spawnSync(wrangler, args, {
    cwd: runtimeDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
};

const port = 8794;
const baseUrl = `http://127.0.0.1:${port}`;
const serverOutput: string[] = [];
let server: ReturnType<typeof spawn> | undefined;

const waitForServer = async () => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server?.exitCode !== null) {
      throw new Error(`local Pages exited early: ${server?.exitCode}`);
    }
    try {
      if ((await fetch(`${baseUrl}/`)).status === 200) return;
    } catch {
      // Keep waiting for local Pages.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("timed out waiting for local Pages");
};

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
  server.stdout?.on("data", (chunk) => serverOutput.push(String(chunk)));
  server.stderr?.on("data", (chunk) => serverOutput.push(String(chunk)));
  await waitForServer();

  const localFetch: typeof fetch = (input, init) =>
    fetch(String(input), {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Origin: baseUrl,
      },
    });

  const success = await prepareLineLead({
    requestId: "11111111-1111-4111-8111-111111111111",
    attribution: null,
    endpoint: `${baseUrl}/api/line/prepare`,
    fetchImpl: localFetch,
  });
  assert.ok(success);
  assert.match(success.lead_token, /^HY-[A-Z2-9_]{10}$/);

  const timeoutFallback = await prepareLineLead({
    requestId: "22222222-2222-4222-8222-222222222222",
    attribution: null,
    timeoutMs: 20,
    fetchImpl: async () => new Promise<Response>(() => undefined),
  });
  assert.equal(timeoutFallback, null);

  console.log(
    JSON.stringify({
      status: "PASS",
      runtime: baseUrl,
      local_d1: "success with null attribution",
      mobile_prepare_contract: "prepared + HY token",
      timeout_fail_open: "null result; caller uses siteConfig.lineUrl",
      remote_calls: "NONE",
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (serverOutput.length > 0) console.error(serverOutput.join("").slice(-4000));
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) server.kill("SIGTERM");
}
