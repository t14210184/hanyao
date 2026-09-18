import {
  WP01_GTM_WORKSPACE_NAME,
  inspectWp01Workspace,
  assertOnlyWp01WorkspaceChanges,
  assertPublishScope,
  buildDataLayerVariableBody,
  stripReadOnlyTagFields,
} from "./gtm-wp01-funnel-contract.mjs";

const API_ROOT = "https://tagmanager.googleapis.com/tagmanager/v2";
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID?.trim() || "6362127895";
const CONTAINER_ID = process.env.GTM_CONTAINER_ID?.trim() || "256158171";
const CONTAINER_PATH = `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}`;
const ACCESS_TOKEN = process.env.GTM_ACCESS_TOKEN?.trim();
const args = new Set(process.argv.slice(2));
const mode = args.has("--publish") ? "publish" : args.has("--apply") ? "apply" : "dry-run";

if (!ACCESS_TOKEN) {
  console.error("WP01_GTM_AUTH_REQUIRED:GTM_ACCESS_TOKEN");
  process.exit(2);
}

const request = async (path, { method = "GET", body, query } = {}) => {
  const url = new URL(API_ROOT + "/" + path.replace(/^\//, ""));
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    method,
    headers: {
      authorization: "Bearer " + ACCESS_TOKEN,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }
  if (!response.ok || payload?.error) {
    const status =
      payload?.error?.status ||
      payload?.error?.errors?.[0]?.reason ||
      "UNKNOWN";
    const error = new Error(
      "WP01_GTM_HTTP_" +
        response.status +
        "_" +
        String(status).replace(/[^A-Z0-9_]/gi, "_")
    );
    error.httpStatus = response.status;
    throw error;
  }
  return payload;
};

const listAll = async (path, field) => {
  const rows = [];
  let pageToken;
  do {
    const payload = await request(path, { query: { pageToken } });
    rows.push(...(Array.isArray(payload?.[field]) ? payload[field] : []));
    pageToken = payload?.nextPageToken;
  } while (pageToken);
  return rows;
};

const listWorkspaces = () =>
  listAll(CONTAINER_PATH + "/workspaces", "workspace");

const findDedicatedWorkspace = async () => {
  const workspaces = await listWorkspaces();
  const matches = workspaces.filter(
    (workspace) => workspace?.name === WP01_GTM_WORKSPACE_NAME
  );
  if (matches.length > 1) {
    throw new Error("WP01_GTM_DEDICATED_WORKSPACE_COUNT_" + matches.length);
  }
  return matches[0] ?? null;
};

const readWorkspace = async (workspace) => {
  const [status, variables, tags] = await Promise.all([
    request(workspace.path + "/status"),
    listAll(workspace.path + "/variables", "variable"),
    listAll(workspace.path + "/tags", "tag"),
  ]);
  return { workspace, status, variables, tags };
};

const readLive = async () => {
  const live = await request(CONTAINER_PATH + "/versions:live");
  if (!live?.fingerprint || !live?.containerVersionId) {
    throw new Error("WP01_GTM_LIVE_VERSION_IDENTITY_INCOMPLETE");
  }
  return live;
};

const inspectLive = (live) =>
  inspectWp01Workspace({
    workspace: {
      path: "LIVE_VERSION_READONLY/" + live.containerVersionId,
      fingerprint: live.fingerprint,
      name: "LIVE_VERSION_READONLY",
    },
    status: { workspaceChange: [], mergeConflict: [] },
    variables: live.variable ?? [],
    tags: live.tag ?? [],
  });

const ensureDedicatedWorkspace = async () => {
  const existing = await findDedicatedWorkspace();
  if (existing) return { workspace: existing, created: false };
  const workspace = await request(CONTAINER_PATH + "/workspaces", {
    method: "POST",
    body: {
      name: WP01_GTM_WORKSPACE_NAME,
      description:
        "Isolated workspace for HANYAO Ads/Website Optimization v1.0 WP01 funnel observability only.",
    },
  });
  if (!workspace?.path || workspace?.name !== WP01_GTM_WORKSPACE_NAME) {
    throw new Error("WP01_GTM_WORKSPACE_CREATE_READBACK_INVALID");
  }
  return { workspace, created: true };
};

const apply = async () => {
  const { workspace, created } = await ensureDedicatedWorkspace();
  let state = await readWorkspace(workspace);
  assertOnlyWp01WorkspaceChanges(state.status);
  let plan = inspectWp01Workspace(state);
  const variablesCreated = plan.variablesToCreate.map((item) => item.name);
  let tagUpdated = false;

  for (const spec of plan.variablesToCreate) {
    await request(workspace.path + "/variables", {
      method: "POST",
      body: buildDataLayerVariableBody(spec),
    });
  }

  state = await readWorkspace(workspace);
  assertOnlyWp01WorkspaceChanges(state.status);
  plan = inspectWp01Workspace(state);

  if (plan.tagNeedsUpdate) {
    tagUpdated = true;
    await request(plan.targetTag.path, {
      method: "PUT",
      query: { fingerprint: plan.targetTag.fingerprint },
      body: stripReadOnlyTagFields(plan.updatedTag),
    });
  }

  state = await readWorkspace(workspace);
  assertOnlyWp01WorkspaceChanges(state.status);
  plan = inspectWp01Workspace(state);
  if (!plan.ready) {
    throw new Error("WP01_GTM_APPLY_READBACK_NOT_CONVERGED");
  }

  console.log(
    JSON.stringify({
      result: "WP01_GTM_APPLY_CONFIRMED",
      mutationApplied: created || variablesCreated.length > 0 || tagUpdated,
      workspaceCreated: created,
      workspacePath: workspace.path,
      variablesCreated,
      targetTagUpdated: tagUpdated,
      targetTag: "GA4 Event - line_contact_attempt",
      canonicalAdsSenderTouched: 0,
      googleAdsTagsTouched: 0,
      publishApplied: false,
    })
  );
};

const publish = async () => {
  const workspace = await findDedicatedWorkspace();
  if (!workspace) throw new Error("WP01_GTM_PUBLISH_WORKSPACE_NOT_FOUND");

  const state = await readWorkspace(workspace);
  assertPublishScope(state);

  const created = await request(workspace.path + ":create_version", {
    method: "POST",
    body: {
      name: "HANYAO WP01 Funnel Observability 20260918",
      notes:
        "Adds service_type, prepare_status and handoff_type to line_contact_attempt; removes legacy lead_id mapping. No Google Ads conversion tag change.",
    },
  });

  if (created?.compilerError) {
    throw new Error("WP01_GTM_CREATE_VERSION_COMPILER_ERROR");
  }
  if ((created?.syncStatus?.mergeConflict ?? []).length > 0) {
    throw new Error("WP01_GTM_CREATE_VERSION_SYNC_CONFLICT");
  }

  const version = created?.containerVersion;
  if (!version?.path || !version?.fingerprint || !version?.containerVersionId) {
    throw new Error("WP01_GTM_CREATED_VERSION_IDENTITY_INCOMPLETE");
  }

  const versionReadback = await request(version.path);
  const versionPlan = inspectLive(versionReadback);
  if (!versionPlan.ready) {
    throw new Error("WP01_GTM_CREATED_VERSION_NOT_CONVERGED");
  }

  let publishConfirmed = false;
  try {
    const published = await request(version.path + ":publish", {
      method: "POST",
      query: { fingerprint: versionReadback.fingerprint },
    });
    if (published?.compilerError) {
      throw new Error("WP01_GTM_PUBLISH_COMPILER_ERROR");
    }
    publishConfirmed = true;
  } catch (error) {
    const liveAfterUnknown = await readLive();
    if (liveAfterUnknown.containerVersionId === version.containerVersionId) {
      publishConfirmed = true;
    } else {
      throw new Error(
        "WP01_GTM_PUBLISH_RESULT_UNKNOWN_READBACK_REQUIRED:" +
          (error instanceof Error ? error.message : "UNKNOWN")
      );
    }
  }

  const live = await readLive();
  if (!publishConfirmed || live.containerVersionId !== version.containerVersionId) {
    throw new Error("WP01_GTM_PUBLISH_READBACK_VERSION_MISMATCH");
  }
  const livePlan = inspectLive(live);
  if (!livePlan.ready) {
    throw new Error("WP01_GTM_LIVE_READBACK_NOT_CONVERGED");
  }

  console.log(
    JSON.stringify({
      result: "WP01_GTM_PUBLISH_CONFIRMED",
      mutationApplied: true,
      publishedVersionId: live.containerVersionId,
      publishedFingerprint: live.fingerprint,
      newWorkspacePath: created?.newWorkspacePath ?? null,
      canonicalAdsSenderTouched: 0,
      googleAdsTagsTouched: 0,
    })
  );
};

const dryRun = async () => {
  const [live, dedicated] = await Promise.all([
    readLive(),
    findDedicatedWorkspace(),
  ]);
  const plan = inspectLive(live);
  let dedicatedState = null;
  if (dedicated) {
    const state = await readWorkspace(dedicated);
    assertOnlyWp01WorkspaceChanges(state.status);
    const workspacePlan = inspectWp01Workspace(state);
    dedicatedState = {
      path: dedicated.path,
      ready: workspacePlan.ready,
      workspaceChangeCount: workspacePlan.workspaceChangeCount,
      mergeConflictCount: workspacePlan.mergeConflictCount,
    };
  }

  console.log(
    JSON.stringify({
      result: plan.ready
        ? "WP01_GTM_LIVE_ALREADY_CONVERGED"
        : "WP01_GTM_PROVIDER_CHANGE_REQUIRED",
      mode: "dry-run",
      liveVersionId: live.containerVersionId,
      liveFingerprint: live.fingerprint,
      variablesToCreate: plan.variablesToCreate.map((item) => item.name),
      targetTagNeedsUpdate: plan.tagNeedsUpdate,
      legacyLeadIdMappingPresent: plan.currentEventParameters.some(
        (item) => item.parameter === "lead_id"
      ),
      desiredEventParameters: plan.desiredEventParameters.map(
        (item) => item.parameter
      ),
      dedicatedWorkspace: dedicatedState,
      workspaceCreateRequired: !dedicated,
      canonicalAdsSenderTouched: 0,
      googleAdsTagsTouched: 0,
      mutationApplied: false,
    })
  );
};

try {
  if (mode === "publish") {
    await publish();
  } else if (mode === "apply") {
    await apply();
  } else {
    await dryRun();
  }
} catch (error) {
  console.error(
    "WP01_GTM_FAIL:" +
      (error instanceof Error ? error.message : "UNKNOWN").replace(
        /[^A-Z0-9_:\-]/gi,
        "_"
      )
  );
  process.exit(1);
}
