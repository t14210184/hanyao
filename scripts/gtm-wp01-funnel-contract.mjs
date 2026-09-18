export const WP01_GTM_CONTRACT_VERSION = "hanyao-wp01-gtm-funnel-v1";
export const WP01_GTM_WORKSPACE_NAME = "HANYAO WP01 Funnel Observability 20260918";
export const WP01_GTM_TARGET_TAG_NAME = "GA4 Event - line_contact_attempt";

export const WP01_GTM_VARIABLES = Object.freeze([
  { name: "DLV - service_type", key: "service_type" },
  { name: "DLV - prepare_status", key: "prepare_status" },
  { name: "DLV - handoff_type", key: "handoff_type" },
]);

export const WP01_GTM_EVENT_PARAMETERS = Object.freeze([
  { parameter: "contact_channel", value: "{{DLV - contact_channel}}" },
  { parameter: "contact_method", value: "{{DLV - contact_method}}" },
  { parameter: "page_path", value: "{{DLV - page_path}}" },
  { parameter: "event_source", value: "{{DLV - event_source}}" },
  { parameter: "event_timestamp", value: "{{DLV - timestamp}}" },
  { parameter: "service_type", value: "{{DLV - service_type}}" },
  { parameter: "prepare_status", value: "{{DLV - prepare_status}}" },
  { parameter: "handoff_type", value: "{{DLV - handoff_type}}" },
]);

const clone = (value) => JSON.parse(JSON.stringify(value));

const one = (items, predicate, code) => {
  const matches = (items ?? []).filter(predicate);
  if (matches.length !== 1) {
    throw new Error(code + "_COUNT_" + matches.length);
  }
  return matches[0];
};

const parameterByKey = (tag, key) =>
  (tag?.parameter ?? []).find((item) => item?.key === key);

const decodeEventSettings = (tag) => {
  const table = parameterByKey(tag, "eventSettingsTable");
  if (!table || table.type !== "list" || !Array.isArray(table.list)) {
    throw new Error("WP01_GTM_EVENT_SETTINGS_TABLE_MISSING");
  }
  return table.list.map((row, index) => {
    if (row?.type !== "map" || !Array.isArray(row.map)) {
      throw new Error("WP01_GTM_EVENT_SETTINGS_ROW_INVALID_" + index);
    }
    const name = row.map.find((item) => item?.key === "parameter")?.value;
    const value = row.map.find((item) => item?.key === "parameterValue")?.value;
    if (typeof name !== "string" || typeof value !== "string") {
      throw new Error("WP01_GTM_EVENT_SETTINGS_ROW_INCOMPLETE_" + index);
    }
    return { parameter: name, value };
  });
};

const encodeEventSettings = (pairs) => ({
  type: "list",
  key: "eventSettingsTable",
  list: pairs.map(({ parameter, value }) => ({
    type: "map",
    map: [
      { type: "template", key: "parameter", value: parameter },
      { type: "template", key: "parameterValue", value },
    ],
  })),
});

const dataLayerVariableKey = (variable) =>
  (variable?.parameter ?? []).find((item) => item?.key === "name")?.value;

const assertNoDuplicateNames = (items, label) => {
  const seen = new Set();
  for (const item of items ?? []) {
    if (typeof item?.name !== "string") continue;
    if (seen.has(item.name)) throw new Error(label + "_DUPLICATE_NAME_" + item.name);
    seen.add(item.name);
  }
};

const sortedPairs = (pairs) =>
  [...pairs].sort((a, b) => a.parameter.localeCompare(b.parameter));

export const inspectWp01Workspace = ({ workspace, status, variables, tags }) => {
  if (!workspace?.path || !workspace?.fingerprint) {
    throw new Error("WP01_GTM_WORKSPACE_IDENTITY_INCOMPLETE");
  }
  if ((status?.mergeConflict ?? []).length > 0) {
    throw new Error("WP01_GTM_WORKSPACE_HAS_MERGE_CONFLICT");
  }

  assertNoDuplicateNames(variables, "WP01_GTM_VARIABLE");
  assertNoDuplicateNames(tags, "WP01_GTM_TAG");

  const target = one(
    tags,
    (tag) => tag?.name === WP01_GTM_TARGET_TAG_NAME,
    "WP01_GTM_TARGET_TAG"
  );
  if (target.type !== "gaawe") throw new Error("WP01_GTM_TARGET_TAG_TYPE_CHANGED");
  if (!target.path || !target.fingerprint) {
    throw new Error("WP01_GTM_TARGET_TAG_IDENTITY_INCOMPLETE");
  }
  const eventName = parameterByKey(target, "eventName")?.value;
  if (eventName !== "line_contact_attempt") {
    throw new Error("WP01_GTM_TARGET_EVENT_NAME_CHANGED");
  }
  const measurementId = parameterByKey(target, "measurementIdOverride")?.value;
  if (typeof measurementId !== "string" || !measurementId.startsWith("G-")) {
    throw new Error("WP01_GTM_MEASUREMENT_ID_INVALID");
  }
  if (!Array.isArray(target.firingTriggerId) || target.firingTriggerId.length !== 1) {
    throw new Error("WP01_GTM_TARGET_TRIGGER_AMBIGUOUS");
  }

  const currentPairs = decodeEventSettings(target);
  const currentNames = currentPairs.map((item) => item.parameter);
  const duplicatePair = currentNames.find(
    (name, index) => currentNames.indexOf(name) !== index
  );
  if (duplicatePair) {
    throw new Error("WP01_GTM_DUPLICATE_EVENT_PARAMETER_" + duplicatePair);
  }

  const allowedBefore = new Set([
    "contact_channel",
    "contact_method",
    "page_path",
    "event_source",
    "event_timestamp",
    "lead_id",
    "service_type",
    "prepare_status",
    "handoff_type",
  ]);
  for (const pair of currentPairs) {
    if (!allowedBefore.has(pair.parameter)) {
      throw new Error("WP01_GTM_UNEXPECTED_EVENT_PARAMETER_" + pair.parameter);
    }
  }

  const requiredLegacyValues = new Map(
    WP01_GTM_EVENT_PARAMETERS.slice(0, 5).map((item) => [item.parameter, item.value])
  );
  for (const [name, expected] of requiredLegacyValues) {
    const actual = currentPairs.find((item) => item.parameter === name)?.value;
    if (actual !== expected) {
      throw new Error("WP01_GTM_BASE_PARAMETER_DRIFT_" + name);
    }
  }

  const variablesByName = new Map((variables ?? []).map((item) => [item.name, item]));
  const variablesToCreate = [];
  for (const spec of WP01_GTM_VARIABLES) {
    const existing = variablesByName.get(spec.name);
    if (!existing) {
      variablesToCreate.push(spec);
      continue;
    }
    if (existing.type !== "v" || dataLayerVariableKey(existing) !== spec.key) {
      throw new Error("WP01_GTM_VARIABLE_DRIFT_" + spec.name);
    }
  }

  const desiredPairs = WP01_GTM_EVENT_PARAMETERS;
  const tagNeedsUpdate =
    JSON.stringify(sortedPairs(currentPairs.filter((p) => p.parameter !== "lead_id"))) !==
      JSON.stringify(sortedPairs(desiredPairs)) ||
    currentPairs.some((item) => item.parameter === "lead_id");

  const updatedTag = clone(target);
  if (tagNeedsUpdate) {
    updatedTag.parameter = (updatedTag.parameter ?? []).map((item) =>
      item?.key === "eventSettingsTable" ? encodeEventSettings(desiredPairs) : item
    );
  }

  const workspaceChanges = status?.workspaceChange ?? [];

  return {
    contractVersion: WP01_GTM_CONTRACT_VERSION,
    workspace: {
      path: workspace.path,
      fingerprint: workspace.fingerprint,
      name: workspace.name ?? null,
    },
    targetTag: {
      path: target.path,
      fingerprint: target.fingerprint,
      measurementId,
      firingTriggerId: [...target.firingTriggerId],
    },
    variablesToCreate,
    tagNeedsUpdate,
    updatedTag,
    currentEventParameters: currentPairs,
    desiredEventParameters: desiredPairs,
    legacyLeadIdRemoved: currentPairs.some((item) => item.parameter === "lead_id"),
    workspaceChangeCount: workspaceChanges.length,
    mergeConflictCount: (status?.mergeConflict ?? []).length,
    mutationScope: {
      createVariables: variablesToCreate.map((item) => item.name),
      updateTags: tagNeedsUpdate ? [WP01_GTM_TARGET_TAG_NAME] : [],
      googleAdsTagsTouched: 0,
      canonicalAdsSenderTouched: 0,
    },
    ready:
      variablesToCreate.length === 0 &&
      !tagNeedsUpdate &&
      (status?.mergeConflict ?? []).length === 0,
  };
};

export const assertPublishScope = ({ status, variables, tags }) => {
  if ((status?.mergeConflict ?? []).length > 0) {
    throw new Error("WP01_GTM_PUBLISH_BLOCKED_MERGE_CONFLICT");
  }
  const changes = status?.workspaceChange ?? [];
  for (const change of changes) {
    const entity = change?.tag ?? change?.variable ?? change?.trigger ?? change?.folder;
    const name = entity?.name;
    const isTargetTag = change?.tag?.name === WP01_GTM_TARGET_TAG_NAME;
    const isTargetVariable = WP01_GTM_VARIABLES.some((item) => item.name === change?.variable?.name);
    if (!isTargetTag && !isTargetVariable) {
      throw new Error("WP01_GTM_PUBLISH_BLOCKED_UNRELATED_CHANGE_" + String(name ?? "UNKNOWN"));
    }
  }
  const plan = inspectWp01Workspace({
    workspace: { path: "publish-check", fingerprint: "publish-check" },
    status: { workspaceChange: changes, mergeConflict: [] },
    variables,
    tags,
  });
  if (!plan.ready) throw new Error("WP01_GTM_PUBLISH_BLOCKED_NOT_CONVERGED");
  return true;
};

export const buildDataLayerVariableBody = ({ name, key }) => ({
  name,
  type: "v",
  parameter: [
    { type: "template", key: "name", value: key },
    { type: "template", key: "defaultValue", value: "" },
  ],
});

export const stripReadOnlyTagFields = (tag) => {
  const copy = clone(tag);
  for (const key of [
    "path",
    "accountId",
    "containerId",
    "workspaceId",
    "tagId",
    "tagManagerUrl",
    "fingerprint",
  ]) {
    delete copy[key];
  }
  return copy;
};
