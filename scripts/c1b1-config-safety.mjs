import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PLACEHOLDER = "C1B1_LOCAL_ONLY_NO_PRODUCTION_ID";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const args = process.argv.slice(2);
const remoteMode = args.includes("--remote");
const localMode = args.includes("--local");
const configIndex = args.indexOf("--config");
const configPath = resolve(
  configIndex >= 0 && args[configIndex + 1]
    ? args[configIndex + 1]
    : "wrangler.jsonc"
);

if (!existsSync(configPath)) {
  console.error(`CONFIG_SAFETY_FAIL: config not found: ${configPath}`);
  process.exit(1);
}

const configText = readFileSync(configPath, "utf8");
if (remoteMode && configText.includes(PLACEHOLDER)) {
  console.error("CONFIG_SAFETY_FAIL: local placeholder present in remote config");
  process.exit(1);
}

if (!remoteMode) {
  if (configText.includes(PLACEHOLDER) && !localMode) {
    console.error(
      "CONFIG_SAFETY_FAIL: local placeholder requires explicit --local mode"
    );
    process.exit(1);
  }
  console.log(`CONFIG_SAFETY_PASS: ${configPath}`);
  process.exit(0);
}

const remoteDatabaseId = process.env.C1B1_REMOTE_D1_DATABASE_ID ?? "";
if (!UUID_PATTERN.test(remoteDatabaseId)) {
  console.error(
    "CONFIG_SAFETY_FAIL: remote deploy requires C1B1_REMOTE_D1_DATABASE_ID as a real D1 UUID"
  );
  process.exit(1);
}
if (!configText.includes("ATTRIBUTION_DB")) {
  console.error("CONFIG_SAFETY_FAIL: remote config has no ATTRIBUTION_DB binding");
  process.exit(1);
}

console.log("CONFIG_SAFETY_PASS: explicit remote D1 id and binding supplied");
