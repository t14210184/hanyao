import assert from "node:assert/strict";
import { existsSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const cwd = process.cwd();
const trace = (message) => console.error(`[line1b2b-browser] ${message}`);
const wrangler = join(cwd, "node_modules/.bin/wrangler");
const port = 8795;
const baseUrl = `http://127.0.0.1:${port}`;
const persistTo = mkdtempSync(join(tmpdir(), "line1b2b-local-d1-"));
const runtimeDir = mkdtempSync(join(tmpdir(), "line1b2b-local-runtime-"));
symlinkSync(join(cwd, "out"), join(runtimeDir, "out"), "dir");
symlinkSync(join(cwd, "functions"), join(runtimeDir, "functions"), "dir");
symlinkSync(join(cwd, "migrations"), join(runtimeDir, "migrations"), "dir");

const configPath = join(runtimeDir, "wrangler.jsonc");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      name: "hanyao-line1b2b-local-runtime",
      compatibility_date: "2026-08-25",
      pages_build_output_dir: "./out",
      d1_databases: [
        {
          binding: "ATTRIBUTION_DB",
          database_name: "hanyao-line1b2b-local",
          database_id: "LINE1B2B_LOCAL_ONLY_NO_PRODUCTION_ID",
          preview_database_id: "line1b2b-local-attribution",
          migrations_dir: "./migrations",
        },
      ],
    },
    null,
    2
  )
);

const browserCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  console.log(
    JSON.stringify({
      status: "PARTIAL",
      browser_binary: "UNAVAILABLE",
      fallback: "line1b2b-unit source/contract tests remain available",
      remote_calls: "NONE",
    })
  );
  process.exit(0);
}

const runWrangler = (args) => {
  const result = spawnSync(wrangler, args, {
    cwd: runtimeDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
};

const serverOutput = [];
let server;
let browser;

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

const firstVisible = async (page, selector) => {
  for (const element of await page.$$(selector)) {
    if (await element.boundingBox()) return element;
  }
  throw new Error(`no visible element matched ${selector}`);
};

const waitForQrValue = async (page) => {
  await page.waitForSelector('[role="dialog"] [data-line-qr-value]', {
    timeout: 8_000,
  });
  return page.$eval(
    '[role="dialog"] [data-line-qr-value]',
    (element) => element.getAttribute("data-line-qr-value")
  );
};

try {
  trace("applying local migrations");
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

  trace("starting local Pages");
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
  trace("local Pages ready");

  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  trace("Chrome ready");

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const requests = [];
  const prepareBodies = [];
  let failPrepare = false;
  let profileFallbackRequests = 0;
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    requests.push(url);
    if (url.endsWith("/api/line/prepare") && request.method() === "POST") {
      try {
        prepareBodies.push(JSON.parse(request.postData() || "{}"));
      } catch {
        prepareBodies.push(null);
      }
    }
    if (url === "https://line.me/R/ti/p/@451vpomq") {
      profileFallbackRequests += 1;
      request.abort().catch(() => undefined);
      return;
    }
    if (failPrepare && url.endsWith("/api/line/prepare")) {
      request
        .respond({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "LOCAL_SMOKE_FORCED_FAILURE" }),
        })
        .catch(() => undefined);
      return;
    }
    request.continue().catch(() => undefined);
  });

  const lineSelector = 'a[href="https://line.me/R/ti/p/@451vpomq"]';
  trace("loading home page");
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(lineSelector, { timeout: 8_000 });
  trace("home page ready");
  const cta = await firstVisible(page, lineSelector);
  trace("clicking generic CTA");
  await cta.click({ clickCount: 2, delay: 0 });
  trace("generic CTA clicked");
  const genericQrValue = await waitForQrValue(page);
  trace("generic QR rendered");
  const genericDialogText = await page.$eval(
    '[role="dialog"]',
    (element) => element.textContent || ""
  );
  assert.match(genericQrValue, /^https:\/\/line\.me\/R\/oaMessage\/%40451vpomq\/\?/);
  assert.match(genericQrValue, /HY-[A-Z2-9_]{10}/);
  assert.equal(genericDialogText.includes("使用手機 LINE 掃描"), true);
  assert.equal(genericDialogText.includes("詢價編號"), true);
  assert.equal(prepareBodies.length, 1, "double click must dedupe one active prepare");
  assert.equal(requests.some((url) => /quickchart|qrserver|chart\.googleapis|qr-code-generator/i.test(url)), false);

  await page.click('button[aria-label="關閉 LINE QR 視窗"]');
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  const ctaAgain = await firstVisible(page, lineSelector);
  trace("clicking second generic CTA");
  await ctaAgain.click();
  const secondQrValue = await waitForQrValue(page);
  trace("second QR rendered");
  assert.notEqual(secondQrValue, genericQrValue, "a new intentional click gets a new token");
  await page.click('button[aria-label="關閉 LINE QR 視窗"]');
  await page.waitForSelector('[role="dialog"]', { hidden: true });

  failPrepare = true;
  trace("testing fail-open page");
  const failPage = await browser.newPage();
  await failPage.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await failPage.setRequestInterception(true);
  failPage.on("request", (request) => {
    if (request.url() === "https://line.me/R/ti/p/@451vpomq") {
      profileFallbackRequests += 1;
      request.abort().catch(() => undefined);
      return;
    }
    if (request.url().endsWith("/api/line/prepare")) {
      request
        .respond({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "LOCAL_SMOKE_FORCED_FAILURE" }),
        })
        .catch(() => undefined);
      return;
    }
    request.continue().catch(() => undefined);
  });
  await failPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await failPage.waitForSelector(lineSelector, { timeout: 8_000 });
  const failCta = await firstVisible(failPage, lineSelector);
  await failCta.click();
  await new Promise((resolve) => setTimeout(resolve, 3_600));
  assert.equal(await failPage.$('[role="dialog"]'), null, "failure must not show QR success");

  failPrepare = false;
  trace("testing ContactForm QR");
  const formPage = await browser.newPage();
  await formPage.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await formPage.setRequestInterception(true);
  formPage.on("request", (request) => {
    const url = request.url();
    requests.push(url);
    if (url.endsWith("/api/line/prepare") && request.method() === "POST") {
      try {
        prepareBodies.push(JSON.parse(request.postData() || "{}"));
      } catch {
        prepareBodies.push(null);
      }
    }
    request.continue().catch(() => undefined);
  });
  await formPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await formPage.waitForSelector("#contact-form-submit", { timeout: 8_000 });
  await formPage.type("#name", "王先生");
  await formPage.type("#phone", "08-7552260");
  const serviceValue = await formPage.$eval(
    "#service",
    (element) =>
      [...element.options].find((option) => option.value)?.value || ""
  );
  await formPage.select("#service", serviceValue);
  await formPage.type("#message", "冷氣漏水，請協助評估");
  await formPage.click("#contact-form-submit");
  const formQrValue = await waitForQrValue(formPage);
  trace("ContactForm QR rendered");
  const formDialogText = await formPage.$eval(
    '[role="dialog"]',
    (element) => element.textContent || ""
  );
  assert.match(formQrValue, /HY-[A-Z2-9_]{10}/);
  assert.equal(formQrValue.includes("王先生"), false);
  assert.equal(formQrValue.includes("08-7552260"), false);
  assert.equal(formQrValue.includes("冷氣漏水"), false);
  assert.equal(formDialogText.includes("表單完整內容沒有上傳追蹤伺服器"), true);
  const formPrepareBody = prepareBodies.at(-1);
  assert.deepEqual(Object.keys(formPrepareBody).sort(), ["attribution", "request_id"]);
  assert.equal(JSON.stringify(formPrepareBody).includes("王先生"), false);
  assert.equal(JSON.stringify(formPrepareBody).includes("08-7552260"), false);

  const qrNetworkRequests = requests.filter((url) =>
    /quickchart|qrserver|chart\.googleapis|qr-code-generator/i.test(url)
  );
  console.log(
    JSON.stringify({
      status: "PASS",
      runtime: baseUrl,
      browser: executablePath,
      generic_cta_qr: "PASS",
      contact_form_qr: "PASS",
      qr_payload_contains_pii: false,
      qr_network_requests: qrNetworkRequests,
      prepare_post_body_keys: Object.keys(formPrepareBody).sort(),
      double_click_prepare_count: 1,
      close_then_new_intent: "PASS",
      fail_open_profile_requests: profileFallbackRequests > 0,
      remote_calls: "NONE",
    })
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : error);
  if (serverOutput.length > 0) console.error(serverOutput.join("").slice(-4000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (server && server.exitCode === null) server.kill("SIGTERM");
}
