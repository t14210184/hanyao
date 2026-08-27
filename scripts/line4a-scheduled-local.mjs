import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const workerDir = join(repoRoot, "workers", "google-ads-uploader");
const wranglerCandidates = [
  join(repoRoot, "node_modules/.bin/wrangler"),
  join(repoRoot, "..", "repo", "node_modules/.bin/wrangler"),
  join(repoRoot, "..", "..", "node_modules/.bin/wrangler"),
];
const wrangler = wranglerCandidates.find((path) => existsSync(path));
if (!wrangler) throw new Error("WRANGLER_LOCAL_BINARY_NOT_FOUND");

const configPath = join(workerDir, "wrangler.jsonc");
const persistTo = join(mkdtempSync(join(tmpdir(), "line4a-scheduled-")), "state");

const run = (args) => {
  const result = spawnSync(wrangler, args, {
    cwd: workerDir,
    encoding: "utf8",
    env: { ...process.env, NO_D1_WARNING: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(`Wrangler failed: ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

run([
  "d1", "migrations", "apply", "ATTRIBUTION_DB", "--local", "--persist-to", persistTo,
  "--config", configPath,
]);

const output = [];
const server = spawn(wrangler, [
  "dev", "--local", "--test-scheduled", "--persist-to", persistTo,
  "--config", configPath, "--ip", "127.0.0.1", "--port", "8794",
], {
  cwd: workerDir,
  env: { ...process.env, NO_D1_WARNING: "true", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => output.push(String(chunk)));
server.stderr.on("data", (chunk) => output.push(String(chunk)));

const baseUrl = "http://127.0.0.1:8794";
let ready = false;
try {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) throw new Error(`local Worker exited\n${output.join("")}`);
    try {
      const response = await fetch(`${baseUrl}/__scheduled?format=json`);
      if (response.ok) {
        await response.text();
        ready = true;
        break;
      }
    } catch {
      // Wrangler is still compiling/starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(ready, true, `timed out waiting for scheduled route\n${output.join("")}`);
  const readback = JSON.parse(run([
    "d1", "execute", "ATTRIBUTION_DB", "--local", "--persist-to", persistTo,
    "--config", configPath, "--json", "--command",
    "SELECT COUNT(*) AS count FROM conversion_outbox;",
  ]));
  assert.deepEqual(readback[0].results, [{ count: 0 }]);
  console.log(JSON.stringify({ result: "LINE4A_SCHEDULED_LOCAL_PASS", route: "/__scheduled", rowsProcessed: 0, remoteMutation: false }));
} finally {
  if (server.exitCode === null) {
    await new Promise((resolve) => {
      server.once("exit", resolve);
      server.kill("SIGTERM");
    });
  }
}
