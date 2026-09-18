import assert from "node:assert/strict";
import test from "node:test";
import {
  WP01_GTM_EVENT_PARAMETERS,
  WP01_GTM_VARIABLES,
  WP01_GTM_TARGET_TAG_NAME,
  inspectWp01Workspace,
  assertOnlyWp01WorkspaceChanges,
  assertPublishScope,
  buildDataLayerVariableBody,
  stripReadOnlyTagFields,
} from "./gtm-wp01-funnel-contract.mjs";

const workspace = {
  path: "accounts/6362127895/containers/256158171/workspaces/99",
  fingerprint: "workspace-fp",
  name: "HANYAO WP01 Funnel Observability 20260918",
};

const parameterPair = (parameter, value) => ({
  type: "map",
  map: [
    { type: "template", key: "parameter", value: parameter },
    { type: "template", key: "parameterValue", value },
  ],
});

const legacyTag = () => ({
  path: workspace.path + "/tags/23",
  accountId: "6362127895",
  containerId: "256158171",
  workspaceId: "99",
  tagId: "23",
  name: WP01_GTM_TARGET_TAG_NAME,
  type: "gaawe",
  parameter: [
    { type: "boolean", key: "sendEcommerceData", value: "false" },
    {
      type: "list",
      key: "eventSettingsTable",
      list: [
        parameterPair("contact_channel", "{{DLV - contact_channel}}"),
        parameterPair("contact_method", "{{DLV - contact_method}}"),
        parameterPair("page_path", "{{DLV - page_path}}"),
        parameterPair("event_source", "{{DLV - event_source}}"),
        parameterPair("event_timestamp", "{{DLV - timestamp}}"),
        parameterPair("lead_id", "{{DLV - lead_id}}"),
      ],
    },
    { type: "template", key: "eventName", value: "line_contact_attempt" },
    { type: "template", key: "measurementIdOverride", value: "G-L87XJM1TKZ" },
  ],
  fingerprint: "tag-fp",
  firingTriggerId: ["21"],
  tagManagerUrl: "https://tagmanager.google.com/example",
  consentSettings: { consentStatus: "notSet" },
});

const dlv = (name, key, id) => ({
  path: workspace.path + "/variables/" + id,
  variableId: String(id),
  name,
  type: "v",
  parameter: [{ type: "template", key: "name", value: key }],
  fingerprint: "var-fp-" + id,
});

const legacyVariables = () => [
  dlv("DLV - contact_channel", "contact_channel", 15),
  dlv("DLV - contact_method", "contact_method", 16),
  dlv("DLV - lead_id", "lead_id", 17),
  dlv("DLV - page_path", "page_path", 18),
  dlv("DLV - event_source", "event_source", 19),
  dlv("DLV - timestamp", "timestamp", 20),
];

const cleanStatus = () => ({ workspaceChange: [], mergeConflict: [] });

const converged = () => {
  const initial = inspectWp01Workspace({
    workspace,
    status: cleanStatus(),
    variables: legacyVariables(),
    tags: [legacyTag()],
  });
  const variables = [
    ...legacyVariables(),
    ...WP01_GTM_VARIABLES.map((spec, index) =>
      dlv(spec.name, spec.key, 30 + index)
    ),
  ];
  const tag = {
    ...initial.updatedTag,
    fingerprint: "tag-fp-after",
  };
  return { variables, tag };
};

test("WP01 plan adds only bounded safe DLVs and replaces legacy lead_id mapping", () => {
  const plan = inspectWp01Workspace({
    workspace,
    status: cleanStatus(),
    variables: legacyVariables(),
    tags: [legacyTag()],
  });

  assert.deepEqual(
    plan.variablesToCreate.map((item) => item.name),
    [
      "DLV - service_type",
      "DLV - prepare_status",
      "DLV - handoff_type",
      "DLV - landing_path",
      "DLV - campaign_id",
    ]
  );
  assert.equal(plan.tagNeedsUpdate, true);
  assert.equal(plan.legacyLeadIdRemoved, true);
  assert.deepEqual(
    plan.desiredEventParameters.map((item) => item.parameter),
    WP01_GTM_EVENT_PARAMETERS.map((item) => item.parameter)
  );
  assert.equal(
    plan.desiredEventParameters.some((item) => item.parameter === "lead_id"),
    false
  );
  assert.equal(plan.mutationScope.googleAdsTagsTouched, 0);
  assert.equal(plan.mutationScope.canonicalAdsSenderTouched, 0);
});

test("WP01 converged state is idempotent and ready for publish", () => {
  const { variables, tag } = converged();
  const plan = inspectWp01Workspace({
    workspace,
    status: cleanStatus(),
    variables,
    tags: [tag],
  });
  assert.equal(plan.ready, true);
  assert.deepEqual(plan.variablesToCreate, []);
  assert.equal(plan.tagNeedsUpdate, false);
  assert.equal(
    plan.currentEventParameters.some((item) => item.parameter === "lead_id"),
    false
  );
});

test("WP01 fails closed on duplicate/ambiguous target tag", () => {
  assert.throws(
    () =>
      inspectWp01Workspace({
        workspace,
        status: cleanStatus(),
        variables: legacyVariables(),
        tags: [legacyTag(), { ...legacyTag(), tagId: "24" }],
      }),
    /WP01_GTM_TAG_DUPLICATE_NAME|WP01_GTM_TARGET_TAG_COUNT_2/
  );
});

test("WP01 fails closed on unknown event parameter or DLV drift", () => {
  const tag = legacyTag();
  tag.parameter.find((item) => item.key === "eventSettingsTable").list.push(
    parameterPair("unexpected_key", "{{DLV - something}}")
  );
  assert.throws(
    () =>
      inspectWp01Workspace({
        workspace,
        status: cleanStatus(),
        variables: legacyVariables(),
        tags: [tag],
      }),
    /WP01_GTM_UNEXPECTED_EVENT_PARAMETER_unexpected_key/
  );

  const variables = [
    ...legacyVariables(),
    dlv("DLV - service_type", "wrong_key", 30),
  ];
  assert.throws(
    () =>
      inspectWp01Workspace({
        workspace,
        status: cleanStatus(),
        variables,
        tags: [legacyTag()],
      }),
    /WP01_GTM_VARIABLE_DRIFT_DLV - service_type/
  );
});

test("WP01 rejects unrelated workspace changes before apply or publish", () => {
  assert.throws(
    () =>
      assertOnlyWp01WorkspaceChanges({
        workspaceChange: [
          { tag: { name: "Google Ads Conversion Tracking - DO NOT TOUCH" } },
        ],
        mergeConflict: [],
      }),
    /WP01_GTM_UNRELATED_WORKSPACE_CHANGE/
  );
});

test("WP01 publish scope accepts only converged target tag and safe DLV changes", () => {
  const { variables, tag } = converged();
  const status = {
    workspaceChange: [
      { tag: { name: WP01_GTM_TARGET_TAG_NAME } },
      { variable: { name: "DLV - service_type" } },
      { variable: { name: "DLV - prepare_status" } },
      { variable: { name: "DLV - handoff_type" } },
      { variable: { name: "DLV - landing_path" } },
      { variable: { name: "DLV - campaign_id" } },
    ],
    mergeConflict: [],
  };
  assert.equal(assertPublishScope({ status, variables, tags: [tag] }), true);
});

test("WP01 GTM request helpers preserve runtime semantics but strip read-only identity", () => {
  const body = buildDataLayerVariableBody(WP01_GTM_VARIABLES[0]);
  assert.equal(body.name, "DLV - service_type");
  assert.equal(body.type, "v");
  assert.equal(
    body.parameter.find((item) => item.key === "name")?.value,
    "service_type"
  );

  const stripped = stripReadOnlyTagFields(legacyTag());
  assert.equal("tagId" in stripped, false);
  assert.equal("fingerprint" in stripped, false);
  assert.equal(stripped.name, WP01_GTM_TARGET_TAG_NAME);
  assert.deepEqual(stripped.firingTriggerId, ["21"]);
  assert.equal(
    stripped.parameter.find((item) => item.key === "measurementIdOverride")?.value,
    "G-L87XJM1TKZ"
  );
});
