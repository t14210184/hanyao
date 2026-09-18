import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const API_BASE = "https://api.cloudflare.com/client/v4";
const MAX_SCHEDULED_SCRIPT_READS = 50;

const plainTextVars = (bindings) =>
  Object.fromEntries(
    (bindings ?? [])
      .filter((binding) => binding?.type === "plain_text" && typeof binding.name === "string")
      .map((binding) => [binding.name, String(binding.text ?? "")])
  );

const d1BindingIds = (bindings) =>
  (bindings ?? [])
    .filter((binding) => binding?.type === "d1")
    .map((binding) => binding.database_id ?? binding.id)
    .filter((id) => typeof id === "string" && id.length > 0);

export const isRealDeliveryWorker = (
  worker,
  expectedD1Id,
  expectedAccountId,
  expectedActionId
) => {
  const active = worker.active ?? {};
  const vars = active.vars ?? {};
  const schedules = Array.isArray(worker.schedules) ? worker.schedules : [];
  const accountMatches =
    !expectedAccountId || vars.GOOGLE_ADS_ACCOUNT_ID === expectedAccountId;
  const actionMatches =
    !expectedActionId || vars.GOOGLE_ADS_CONVERSION_ACTION_ID === expectedActionId;
  const deliveryEnabled = vars.GOOGLE_DELIVERY_ENABLED !== "false";

  return (
    schedules.length > 0 &&
    active.trafficPercent === 100 &&
    Array.isArray(active.handlers) &&
    active.handlers.includes("scheduled") &&
    Array.isArray(active.d1BindingIds) &&
    active.d1BindingIds.includes(expectedD1Id) &&
    vars.UPLOADER_ENVIRONMENT === "production" &&
    vars.GOOGLE_DATA_MANAGER_VALIDATE_ONLY === "false" &&
    typeof vars.GOOGLE_ADS_ACCOUNT_ID === "string" &&
    vars.GOOGLE_ADS_ACCOUNT_ID.length > 0 &&
    typeof vars.GOOGLE_ADS_CONVERSION_ACTION_ID === "string" &&
    vars.GOOGLE_ADS_CONVERSION_ACTION_ID.length > 0 &&
    accountMatches &&
    actionMatches &&
    deliveryEnabled
  );
};

export const auditTopology = (
  inventory,
  expectedD1Id,
  expectedAccountId,
  expectedActionId
) => {
  const workers = Array.isArray(inventory?.workers) ? inventory.workers : [];
  const candidates = workers.filter((worker) =>
    isRealDeliveryWorker(worker, expectedD1Id, expectedAccountId, expectedActionId)
  );
  const names = candidates.map((worker) => worker.name).filter((name) => typeof name === "string");

  return {
    result: names.length === 1 ? "HG09_TOPOLOGY_AUDIT_PASS" : "HG09_TOPOLOGY_AUDIT_FAIL",
    scheduledRealDeliveryWorkerCount: names.length,
    onlyWriter: names.length === 1 ? names[0] : null,
    scheduledRealDeliveryWorkers: names,
    boundedWorkerInventoryCount: workers.length,
  };
};

const getToken = () => {
  const configured = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (configured) return configured;
  const wranglerToken = process.env.WRANGLER_AUTH_TOKEN?.trim();
  if (wranglerToken) return wranglerToken;

  const wranglerBin = process.env.WRANGLER_BIN?.trim() || "wrangler";
  const output = execFileSync(wranglerBin, ["auth", "token", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const parsed = JSON.parse(output);
  if (typeof parsed.token !== "string" || parsed.token.length === 0) {
    throw new Error("CLOUDFLARE_READONLY_TOKEN_UNAVAILABLE");
  }
  return parsed.token;
};

export const readLiveInventory = async ({
  accountId,
  token,
  fetchImpl = fetch,
  apiBase = API_BASE,
}) => {
  const request = async (path) => {
    const response = await fetchImpl(apiBase + "/accounts/" + accountId + path, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("CLOUDFLARE_READBACK_FAILED_HTTP_" + response.status);
    const body = await response.json();
    if (body?.success === false) throw new Error("CLOUDFLARE_READBACK_FAILED_API");
    return body;
  };

  const scriptsPayload = await request("/workers/scripts");
  const scripts = Array.isArray(scriptsPayload.result)
    ? scriptsPayload.result
    : Array.isArray(scriptsPayload.result?.scripts)
      ? scriptsPayload.result.scripts
      : [];
  const scheduledScripts = scripts.filter((script) =>
    Array.isArray(script?.handlers) && script.handlers.includes("scheduled")
  );
  if (scheduledScripts.length > MAX_SCHEDULED_SCRIPT_READS) {
    throw new Error("CLOUDFLARE_READBACK_BOUNDED_SCRIPT_LIMIT_EXCEEDED");
  }

  const workers = [];
  for (const script of scheduledScripts) {
    const name = script.id ?? script.script_name ?? script.name;
    if (typeof name !== "string" || name.length === 0) continue;
    const [schedulesPayload, deploymentsPayload] = await Promise.all([
      request("/workers/scripts/" + encodeURIComponent(name) + "/schedules"),
      request("/workers/scripts/" + encodeURIComponent(name) + "/deployments"),
    ]);
    const schedules = Array.isArray(schedulesPayload.result?.schedules)
      ? schedulesPayload.result.schedules.map((item) => ({ cron: item.cron }))
      : [];
    const deployments = Array.isArray(deploymentsPayload.result?.deployments)
      ? deploymentsPayload.result.deployments
      : [];
    const deployment = deployments[0];
    const version = (deployment?.versions ?? []).find((item) => item?.percentage === 100);
    const active = {
      trafficPercent: version?.percentage ?? 0,
      handlers: [],
      d1BindingIds: [],
      vars: {},
    };
    if (version?.version_id) {
      const versionPayload = await request(
        "/workers/scripts/" +
          encodeURIComponent(name) +
          "/versions/" +
          encodeURIComponent(version.version_id)
      );
      const metadata = versionPayload.result ?? {};
      const bindings = metadata.resources?.bindings ?? [];
      active.handlers = metadata.resources?.script?.handlers ?? [];
      active.d1BindingIds = d1BindingIds(bindings);
      active.vars = plainTextVars(bindings);
    }
    workers.push({ name, schedules, active });
  }
  return { workers };
};

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async () => {
  const accountId = option("--account") ?? process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const expectedD1Id = option("--production-d1") ?? process.env.HG09_PRODUCTION_D1_ID?.trim();
  const expectedAccountId =
    option("--ads-account") ?? process.env.HG09_PRODUCTION_ADS_ACCOUNT_ID?.trim();
  const expectedActionId =
    option("--action") ?? process.env.HG09_PRODUCTION_ACTION_ID?.trim();
  if (!accountId || !expectedD1Id) {
    throw new Error("HG09_TOPOLOGY_AUDIT_REQUIRES_ACCOUNT_AND_PRODUCTION_D1");
  }
  const inventory = await readLiveInventory({
    accountId,
    token: getToken(),
  });
  const result = auditTopology(
    inventory,
    expectedD1Id,
    expectedAccountId,
    expectedActionId
  );
  console.log(JSON.stringify(result));
  if (result.result !== "HG09_TOPOLOGY_AUDIT_PASS") process.exitCode = 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "HG09_TOPOLOGY_AUDIT_FAILED");
    process.exitCode = 2;
  });
}
