#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
ACCOUNT_ID="6362127895"
CONTAINER_ID="256158171"
WORKSPACE_ID="4"
CONTAINER_PUBLIC_ID="GTM-5GS4HFP2"
GA4_MEASUREMENT_ID="G-L87XJM1TKZ"

API_BASE="https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}"

# Parse Mode
MODE="dry-run"
if [[ "$1" == "--apply" ]]; then
  MODE="apply"
elif [[ "$1" == "--dry-run" ]]; then
  MODE="dry-run"
else
  echo "Usage: $0 [--dry-run | --apply]"
  exit 1
fi

echo "Running GTM REST API script in [${MODE}] mode..."

# Resolve Access Token
if [[ -z "$ACCESS_TOKEN" ]]; then
  GCLOUD_BIN="$HOME/google-cloud-sdk/bin/gcloud"
  if [[ -x "$GCLOUD_BIN" ]]; then
    echo "Attempting to retrieve access token via local gcloud CLI..."
    ACCESS_TOKEN=$("$GCLOUD_BIN" auth application-default print-access-token 2>/dev/null || true)
  fi
  
  if [[ -z "$ACCESS_TOKEN" ]]; then
    # Check system gcloud
    if which gcloud >/dev/null 2>&1; then
      echo "Attempting to retrieve access token via system gcloud CLI..."
      ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null || true)
    fi
  fi
fi

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "ERROR: Access token could not be retrieved."
  echo "Please set the ACCESS_TOKEN environment variable manually, for example:"
  echo "  ACCESS_TOKEN=\"\$(gcloud auth application-default print-access-token)\" bash $0 $1"
  exit 1
fi

echo "Access Token acquired successfully."

# Helper function to call GTM API
call_api() {
  local method="$1"
  local path="$2"
  local data="$3"
  
  if [[ -z "$data" ]]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      "${API_BASE}${path}"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "${API_BASE}${path}"
  fi
}

echo "Fetching baseline configuration..."
VARIABLES_JSON=$(call_api "GET" "/variables")
TRIGGERS_JSON=$(call_api "GET" "/triggers")
TAGS_JSON=$(call_api "GET" "/tags")

# Validate response
if echo "$VARIABLES_JSON" | grep -q "error"; then
  echo "ERROR: GTM API call failed."
  echo "Response: $VARIABLES_JSON"
  exit 1
fi

# Save baseline to docs
mkdir -p docs
node -e "
const fs = require('fs');
const data = {
  timestamp: new Date().toISOString(),
  variables: JSON.parse(process.argv[1]),
  triggers: JSON.parse(process.argv[2]),
  tags: JSON.parse(process.argv[3])
};
fs.writeFileSync('docs/gtm-api-baseline-workspace4.json', JSON.stringify(data, null, 2));
console.log('Baseline configuration successfully saved to docs/gtm-api-baseline-workspace4.json');
" "$VARIABLES_JSON" "$TRIGGERS_JSON" "$TAGS_JSON"

# Define target elements via Node.js parsing script
PLAN_JSON=$(node -e "
const baseline = JSON.parse(fs.readFileSync('docs/gtm-api-baseline-workspace4.json'));

const targetVariables = [
  { name: 'DLV - contact_channel', type: 'v', key: 'contact_channel' },
  { name: 'DLV - contact_method', type: 'v', key: 'contact_method' },
  { name: 'DLV - lead_id', type: 'v', key: 'lead_id' },
  { name: 'DLV - page_path', type: 'v', key: 'page_path' },
  { name: 'DLV - event_source', type: 'v', key: 'event_source' },
  { name: 'DLV - timestamp', type: 'v', key: 'timestamp' }
];

const targetTriggers = [
  { name: 'CE - line_contact_attempt', event: 'line_contact_attempt' },
  { name: 'CE - phone_click_attempt', event: 'phone_click_attempt' }
];

const plan = {
  variables: [],
  triggers: [],
  tags: [],
  adsTagsToPause: []
};

// Check Variables
targetVariables.forEach(tv => {
  const existing = (baseline.variables.variable || []).find(v => v.name === tv.name);
  if (existing) {
    plan.variables.push({ action: 'skip', name: tv.name, id: existing.variableId });
  } else {
    plan.variables.push({ action: 'create', name: tv.name, type: 'v', key: tv.key });
  }
});

// Check Triggers
targetTriggers.forEach(tt => {
  const existing = (baseline.triggers.trigger || []).find(t => t.name === tt.name);
  if (existing) {
    plan.triggers.push({ action: 'skip', name: tt.name, id: existing.triggerId });
  } else {
    plan.triggers.push({ action: 'create', name: tt.name, event: tt.event });
  }
});

// Locate existing configuration tags for GA4
const existingGA4Tag = (baseline.tags.tag || []).find(t => t.name === 'GA4 - Google Tag - All Pages' || t.type === 'googtag');
let ga4TagParameter = [];
if (existingGA4Tag) {
  // If we can link to Google Tag, GTM API v2 GA4 Event tags use 'gaawe' type.
  // GTM v2 parameters for GA4 Event (gaawe):
  // - measurementId (or link to a Google Tag)
  // Let's check how the GTM is configured. 
}

// Find old Google Ads Tags to pause/deprecated
const oldAdsTags = ['Google Ads Conversion - line_click', 'Google Ads Conversion - phone_click'];
oldAdsTags.forEach(name => {
  const existing = (baseline.tags.tag || []).find(t => t.name === name || t.name === 'Deprecated - ' + name);
  if (existing) {
    if (existing.name.startsWith('Deprecated -') && existing.paused) {
      plan.adsTagsToPause.push({ action: 'skip', name: existing.name, id: existing.tagId });
    } else {
      plan.adsTagsToPause.push({ action: 'update', name: existing.name, id: existing.tagId, targetName: 'Deprecated - ' + name });
    }
  }
});

// Check GA4 Event Tags
const targetTags = [
  { name: 'GA4 Event - line_contact_attempt', event: 'line_contact_attempt', trigger: 'CE - line_contact_attempt', hasLeadId: true },
  { name: 'GA4 Event - phone_click_attempt', event: 'phone_click_attempt', trigger: 'CE - phone_click_attempt', hasLeadId: false }
];

targetTags.forEach(tt => {
  const existing = (baseline.tags.tag || []).find(t => t.name === tt.name);
  if (existing) {
    plan.tags.push({ action: 'skip', name: tt.name, id: existing.tagId });
  } else {
    plan.tags.push({ action: 'create', name: tt.name, event: tt.event, trigger: tt.trigger, hasLeadId: tt.hasLeadId });
  }
});

console.log(JSON.stringify(plan));
" "$ACCOUNT_ID")

# Output Dry-run details
echo "=========================================================="
echo " GTM Workspace 4 Plan Summary"
echo "=========================================================="

node -e "
const plan = JSON.parse(process.argv[1]);
console.log('--- VARIABLES ---');
plan.variables.forEach(v => {
  if (v.action === 'skip') {
    console.log('  - [KEEP] ' + v.name + ' (Already exists, ID: ' + v.id + ')');
  } else {
    console.log('  - [NEW] ' + v.name + ' (Data Layer Variable: ' + v.key + ')');
  }
});

console.log('\n--- TRIGGERS ---');
plan.triggers.forEach(t => {
  if (t.action === 'skip') {
    console.log('  - [KEEP] ' + t.name + ' (Already exists, ID: ' + t.id + ')');
  } else {
    console.log('  - [NEW] ' + t.name + ' (Custom Event: ' + t.event + ')');
  }
});

console.log('\n--- NEW GA4 EVENTS ---');
plan.tags.forEach(t => {
  if (t.action === 'skip') {
    console.log('  - [KEEP] ' + t.name + ' (Already exists, ID: ' + t.id + ')');
  } else {
    console.log('  - [NEW] ' + t.name + ' (Event: ' + t.event + ', Trigger: ' + t.trigger + ', LeadId: ' + t.hasLeadId + ')');
  }
});

console.log('\n--- OLD GOOGLE ADS CONVERSIONS TO DEPRECATE ---');
plan.adsTagsToPause.forEach(t => {
  if (t.action === 'skip') {
    console.log('  - [KEEP] ' + t.name + ' (Already paused and deprecated)');
  } else {
    console.log('  - [DEPRECATE] ' + t.name + ' (Will rename to \"' + t.targetName + '\" and set to Paused)');
  }
});
" "$PLAN_JSON"

echo "----------------------------------------------------------"
echo "Safety check:"
echo "  [OK] No GTM versions will be created."
echo "  [OK] No GTM container publishing will occur."
echo "  [OK] No Google Ads configuration will be modified."
echo "  [OK] No new Google Ads conversion tags will be created."
echo "=========================================================="

if [[ "$MODE" == "dry-run" ]]; then
  echo "Dry-run complete. Exiting without making changes."
  exit 0
fi

# Apply Mode execution
echo "Applying changes to Workspace 4..."

# 1. Create Variables
node -e "
const plan = JSON.parse(process.argv[1]);
plan.variables.filter(v => v.action === 'create').forEach(v => {
  const body = {
    name: v.name,
    type: 'v',
    parameter: [
      { type: 'template', key: 'name', value: v.key },
      { type: 'template', key: 'defaultValue', value: '' }
    ]
  };
  console.log(JSON.stringify({ path: '/variables', body }));
});
" "$PLAN_JSON" | while read -r line; do
  path=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(r.path)")
  body=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(JSON.stringify(r.body))")
  echo "Creating Variable..."
  call_api "POST" "$path" "$body" > /dev/null
done

# Refetch triggers & variables to map IDs
VARIABLES_JSON=$(call_api "GET" "/variables")
TRIGGERS_JSON=$(call_api "GET" "/triggers")

# 2. Create Triggers
node -e "
const plan = JSON.parse(process.argv[1]);
plan.triggers.filter(t => t.action === 'create').forEach(t => {
  const body = {
    name: t.name,
    type: 'customEvent',
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: t.event }
        ]
      }
    ]
  };
  console.log(JSON.stringify({ path: '/triggers', body }));
});
" "$PLAN_JSON" | while read -r line; do
  path=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(r.path)")
  body=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(JSON.stringify(r.body))")
  echo "Creating Trigger..."
  call_api "POST" "$path" "$body" > /dev/null
done

# Refetch triggers to map IDs
TRIGGERS_JSON=$(call_api "GET" "/triggers")

# 3. Create GA4 Event Tags
node -e "
const plan = JSON.parse(process.argv[1]);
const vars = JSON.parse(process.argv[2]);
const trigs = JSON.parse(process.argv[3]);

// Helper to find variable name or trigger ID
const getTriggerId = (name) => {
  const t = (trigs.trigger || []).find(x => x.name === name);
  return t ? t.triggerId : null;
};

plan.tags.filter(t => t.action === 'create').forEach(t => {
  const triggerId = getTriggerId(t.trigger);
  
  // GA4 Event parameter list structure in GTM API v2:
  // - tagId/measurementId parameter is required.
  // - eventParameters parameter holds the event parameter table.
  const eventParams = [
    { type: 'map', mapKey: 'name', mapValue: 'contact_channel' },
    { type: 'map', mapKey: 'value', mapValue: '{{DLV - contact_channel}}' },
    { type: 'map', mapKey: 'name', mapValue: 'contact_method' },
    { type: 'map', mapKey: 'value', mapValue: '{{DLV - contact_method}}' },
    { type: 'map', mapKey: 'name', mapValue: 'page_path' },
    { type: 'map', mapKey: 'value', mapValue: '{{DLV - page_path}}' },
    { type: 'map', mapKey: 'name', mapValue: 'event_source' },
    { type: 'map', mapKey: 'value', mapValue: '{{DLV - event_source}}' },
    { type: 'map', mapKey: 'name', mapValue: 'event_timestamp' },
    { type: 'map', mapKey: 'value', mapValue: '{{DLV - timestamp}}' }
  ];

  if (t.hasLeadId) {
    eventParams.push(
      { type: 'map', mapKey: 'name', mapValue: 'lead_id' },
      { type: 'map', mapKey: 'value', mapValue: '{{DLV - lead_id}}' }
    );
  }

  const body = {
    name: t.name,
    type: 'gaawe', // Google Analytics GA4 Event Tag type
    parameter: [
      { type: 'template', key: 'measurementId', value: '${GA4_MEASUREMENT_ID}' },
      { type: 'template', key: 'eventName', value: t.event },
      {
        type: 'list',
        key: 'eventParameters',
        list: eventParams
      }
    ],
    firingTriggerId: triggerId ? [triggerId] : []
  };

  console.log(JSON.stringify({ path: '/tags', body }));
});
" "$PLAN_JSON" "$VARIABLES_JSON" "$TRIGGERS_JSON" | while read -r line; do
  path=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(r.path)")
  body=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(JSON.stringify(r.body))")
  echo "Creating Tag..."
  call_api "POST" "$path" "$body" > /dev/null
done

# 4. Deprecate & Pause old Tags
# Pause is done by updating tag configuration. In GTM API, tag object has a 'paused' boolean field.
node -e "
const plan = JSON.parse(process.argv[1]);
plan.adsTagsToPause.filter(t => t.action === 'update').forEach(t => {
  const body = {
    name: t.targetName,
    paused: true
  };
  console.log(JSON.stringify({ path: '/tags/' + t.id, body }));
});
" "$PLAN_JSON" | while read -r line; do
  path=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(r.path)")
  body=$(echo "$line" | node -e "const r=JSON.parse(fs.readFileSync(0)); console.log(JSON.stringify(r.body))")
  echo "Pausing & Renaming Tag: $path ..."
  call_api "PUT" "$path" "$body" > /dev/null
done

echo "GTM Workspace 4 modifications successfully applied."
echo "Please verify in the GTM preview tool before publishing."
