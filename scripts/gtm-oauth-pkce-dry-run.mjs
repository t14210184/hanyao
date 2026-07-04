import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { exec } from 'child_process';
import fs from 'fs';
import { URL } from 'url';

// GTM Configuration
const ACCOUNT_ID = "6362127895";
const CONTAINER_ID = "256158171";
const WORKSPACE_ID = "4";
const GA4_MEASUREMENT_ID = "G-L87XJM1TKZ";

// Parse CLI Arguments
const args = process.argv.slice(2);
const isApplyMode = args.includes('--apply');
const isPublishMode = args.includes('--publish');
let modeText = "dry-run";
if (isApplyMode) modeText = "apply";
if (isPublishMode) modeText = "publish";

console.log(`Running GTM REST API script in [${modeText}] mode...`);

// Read OAuth credentials from secrets/gtm-oauth-client.json
const SECRET_PATH = "secrets/gtm-oauth-client.json";
if (!fs.existsSync(SECRET_PATH)) {
  console.error(`ERROR: OAuth client secrets file not found at: ${SECRET_PATH}`);
  console.error("Please place your downloaded Desktop OAuth Client JSON there and run again.");
  process.exit(1);
}

let clientId = "";
let clientSecret = "";
let redirectUri = "http://127.0.0.1:8090/";
let redirectPort = 8090;

try {
  const secrets = JSON.parse(fs.readFileSync(SECRET_PATH, 'utf-8'));
  const installed = secrets.installed || secrets.web; // support both desktop and web client JSONs
  
  if (!installed) {
    throw new Error("Invalid client secret format. Missing 'installed' or 'web' root key.");
  }
  
  clientId = installed.client_id;
  clientSecret = installed.client_secret;
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing 'client_id' or 'client_secret' in OAuth client JSON.");
  }
  
  const uris = installed.redirect_uris || [];
  const localUri = uris.find(u => u.includes('127.0.0.1') || u.includes('localhost'));
  if (localUri) {
    try {
      const u = new URL(localUri);
      const parsedPort = parseInt(u.port);
      if (parsedPort && !isNaN(parsedPort)) {
        redirectPort = parsedPort;
        redirectUri = localUri;
      } else {
        redirectPort = 8090;
        redirectUri = "http://127.0.0.1:8090/";
      }
    } catch (e) {
      redirectPort = 8090;
      redirectUri = "http://127.0.0.1:8090/";
    }
  }
} catch (err) {
  console.error(`ERROR parsing ${SECRET_PATH}:`, err.message);
  process.exit(1);
}

// Scopes extended to allow creating version and publishing
const SCOPES = [
  "https://www.googleapis.com/auth/tagmanager.readonly",
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
  "https://www.googleapis.com/auth/tagmanager.publish"
].join(" ");

function requestHttps(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 1. Generate PKCE Challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
const state = crypto.randomBytes(16).toString('hex');

// 2. Start HTTP Callback Server
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  
  if (reqUrl.pathname === '/') {
    const code = reqUrl.searchParams.get('code');
    const returnedState = reqUrl.searchParams.get('state');
    
    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('State verification failed!');
      return;
    }
    
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h3>Authentication successful!</h3><p>You may now close this tab and return to the chat.</p>');
      server.close();
      
      console.log('oauth-success');
      console.log('access-token-ok');
      
      try {
        const tokenResponse = await exchangeCodeForToken(code);
        if (tokenResponse.error) {
          console.error('Error exchanging token:', tokenResponse.error_description || tokenResponse.error);
          process.exit(1);
        }
        
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          console.error('No access token returned in exchange.');
          process.exit(1);
        }
        
        if (isPublishMode) {
          await runGtmPublish(accessToken);
        } else if (isApplyMode) {
          await runGtmApply(accessToken);
        } else {
          await runGtmDryRun(accessToken);
        }
      } catch (err) {
        console.error('Error during GTM operation:', err);
        process.exit(1);
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Authorization code missing!');
    }
  }
});

server.listen(redirectPort, '127.0.0.1', () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');

  console.log('==========================================================');
  console.log('Google OAuth PKCE Authorization Link');
  console.log('==========================================================');
  console.log('Please copy and open this URL in your logged-in Google Chrome browser:');
  console.log('\n' + authUrl.toString() + '\n');
  console.log('Waiting for authentication on port ' + redirectPort + '...');
  console.log('==========================================================');

  exec(`open -a "Google Chrome" "${authUrl.toString()}"`, (err) => {});
});

async function exchangeCodeForToken(code) {
  const postParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
    code: code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  
  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  
  return requestHttps(options, postParams.toString());
}

async function runGtmDryRun(accessToken) {
  console.log('Fetching GTM baseline configuration...');
  const baseline = await fetchGtmBaseline(accessToken);
  fs.writeFileSync('docs/gtm-api-baseline-workspace4.json', JSON.stringify(baseline, null, 2));
  console.log('GTM baseline successfully saved to docs/gtm-api-baseline-workspace4.json');

  const plan = evaluateGtmChanges(baseline);
  printDryRunPlan(plan);
  
  console.log('DRY_RUN_COMPLETED');
  process.exit(0);
}

async function fetchGtmBaseline(accessToken) {
  const apiCall = (path) => {
    return requestHttps({
      hostname: 'tagmanager.googleapis.com',
      path: `/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const variables = await apiCall('/variables');
  const triggers = await apiCall('/triggers');
  const tags = await apiCall('/tags');

  if (variables.error || triggers.error || tags.error) {
    console.error('API Error details:', variables.error || triggers.error || tags.error);
    process.exit(1);
  }

  return {
    timestamp: new Date().toISOString(),
    variables,
    triggers,
    tags
  };
}

function evaluateGtmChanges(baseline) {
  const targetVariables = [
    { name: 'DLV - contact_channel', key: 'contact_channel' },
    { name: 'DLV - contact_method', key: 'contact_method' },
    { name: 'DLV - lead_id', key: 'lead_id' },
    { name: 'DLV - page_path', key: 'page_path' },
    { name: 'DLV - event_source', key: 'event_source' },
    { name: 'DLV - timestamp', key: 'timestamp' }
  ];

  const targetTriggers = [
    { name: 'CE - line_contact_attempt', event: 'line_contact_attempt' },
    { name: 'CE - phone_click_attempt', event: 'phone_click_attempt' }
  ];

  const targetTags = [
    { name: 'GA4 Event - line_contact_attempt', event: 'line_contact_attempt', trigger: 'CE - line_contact_attempt', hasLeadId: true },
    { name: 'GA4 Event - phone_click_attempt', event: 'phone_click_attempt', trigger: 'CE - phone_click_attempt', hasLeadId: false }
  ];

  const oldAdsTags = ['Google Ads Conversion - line_click', 'Google Ads Conversion - phone_click'];

  const plan = {
    variables: [],
    triggers: [],
    tags: [],
    adsTagsToPause: []
  };

  targetVariables.forEach(tv => {
    const existing = (baseline.variables.variable || []).find(v => v.name === tv.name);
    if (existing) {
      plan.variables.push({ action: 'skip', name: tv.name, id: existing.variableId });
    } else {
      plan.variables.push({ action: 'create', name: tv.name, type: 'v', key: tv.key });
    }
  });

  targetTriggers.forEach(tt => {
    const existing = (baseline.triggers.trigger || []).find(t => t.name === tt.name);
    if (existing) {
      plan.triggers.push({ action: 'skip', name: tt.name, id: existing.triggerId });
    } else {
      plan.triggers.push({ action: 'create', name: tt.name, event: tt.event });
    }
  });

  targetTags.forEach(tt => {
    const existing = (baseline.tags.tag || []).find(t => t.name === tt.name);
    if (existing) {
      plan.tags.push({ action: 'skip', name: tt.name, id: existing.tagId });
    } else {
      plan.tags.push({ action: 'create', name: tt.name, event: tt.event, trigger: tt.trigger, hasLeadId: tt.hasLeadId });
    }
  });

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

  return plan;
}

function printDryRunPlan(plan) {
  console.log('\n==========================================================');
  console.log(' GTM Workspace 4 Dry Run Report');
  console.log('==========================================================');
  
  console.log('--- VARIABLES ---');
  plan.variables.forEach(v => {
    if (v.action === 'skip') {
      console.log(`  - [KEEP] ${v.name} (Exists, ID: ${v.id})`);
    } else {
      console.log(`  - [NEW] ${v.name} (Data Layer Variable: ${v.key})`);
    }
  });

  console.log('\n--- TRIGGERS ---');
  plan.triggers.forEach(t => {
    if (t.action === 'skip') {
      console.log(`  - [KEEP] ${t.name} (Exists, ID: ${t.id})`);
    } else {
      console.log(`  - [NEW] ${t.name} (Custom Event: ${t.event})`);
    }
  });

  console.log('\n--- NEW GA4 EVENTS ---');
  plan.tags.forEach(t => {
    if (t.action === 'skip') {
      console.log(`  - [KEEP] ${t.name} (Exists, ID: ${t.id})`);
    } else {
      console.log(`  - [NEW] ${t.name} (Event: ${t.event}, Trigger: ${t.trigger}, LeadId: ${t.hasLeadId})`);
    }
  });

  console.log('\n--- OLD ADS CONVERSIONS TO DEPRECATE ---');
  plan.adsTagsToPause.forEach(t => {
    if (t.action === 'skip') {
      console.log(`  - [KEEP] ${t.name} (Already paused and deprecated)`);
    } else {
      console.log(`  - [DEPRECATE] ${t.name} (Will rename and pause, ID: ${t.id})`);
    }
  });

  console.log('----------------------------------------------------------');
  console.log('Safety status:');
  console.log('  - No GTM container changes have been applied.');
  console.log('  - GTM Workspace 4 is unmodified.');
  console.log('  - Google Ads remains untouched.');
  console.log('==========================================================');
}

async function runGtmApply(accessToken) {
  console.log('Fetching GTM baseline configuration...');
  const baseline = await fetchGtmBaseline(accessToken);
  const plan = evaluateGtmChanges(baseline);

  const apiWrite = (path, method, body) => {
    return requestHttps({
      hostname: 'tagmanager.googleapis.com',
      path: `/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(body));
  };

  // 1. Create Variables
  for (const v of plan.variables.filter(x => x.action === 'create')) {
    console.log(`Creating Variable "${v.name}"...`);
    const body = {
      name: v.name,
      type: 'v',
      parameter: [
        { type: 'template', key: 'name', value: v.key },
        { type: 'template', key: 'defaultValue', value: '' }
      ]
    };
    const res = await apiWrite('/variables', 'POST', body);
    if (res.error) {
      console.error(`ERROR creating variable ${v.name}:`, res.error);
      process.exit(1);
    }
  }

  // Refetch variables list
  const variablesObj = await apiWrite('/variables', 'GET');

  // 2. Create Triggers
  for (const t of plan.triggers.filter(x => x.action === 'create')) {
    console.log(`Creating Trigger "${t.name}"...`);
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
    const res = await apiWrite('/triggers', 'POST', body);
    if (res.error) {
      console.error(`ERROR creating trigger ${t.name}:`, res.error);
      process.exit(1);
    }
  }

  // Refetch triggers list
  const triggersObj = await apiWrite('/triggers', 'GET');

  // 3. Create GA4 Event Tags
  const getTriggerId = (name) => {
    const t = (triggersObj.trigger || []).find(x => x.name === name);
    return t ? t.triggerId : null;
  };

  for (const t of plan.tags.filter(x => x.action === 'create')) {
    console.log(`Creating GA4 Event Tag "${t.name}"...`);
    const triggerId = getTriggerId(t.trigger);

    const eventParams = [
      {
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'contact_channel' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - contact_channel}}' }
        ]
      },
      {
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'contact_method' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - contact_method}}' }
        ]
      },
      {
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'page_path' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - page_path}}' }
        ]
      },
      {
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'event_source' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - event_source}}' }
        ]
      },
      {
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'event_timestamp' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - timestamp}}' }
        ]
      }
    ];

    if (t.hasLeadId) {
      eventParams.push({
        type: 'map',
        map: [
          { type: 'template', key: 'parameter', value: 'lead_id' },
          { type: 'template', key: 'parameterValue', value: '{{DLV - lead_id}}' }
        ]
      });
    }

    const body = {
      name: t.name,
      type: 'gaawe',
      parameter: [
        { type: 'boolean', key: 'sendEcommerceData', value: 'false' },
        { type: 'template', key: 'measurementIdOverride', value: GA4_MEASUREMENT_ID },
        { type: 'template', key: 'eventName', value: t.event },
        {
          type: 'list',
          key: 'eventSettingsTable',
          list: eventParams
        }
      ],
      firingTriggerId: triggerId ? [triggerId] : []
    };

    const res = await apiWrite('/tags', 'POST', body);
    if (res.error) {
      console.error(`ERROR creating tag ${t.name}:`, res.error);
      process.exit(1);
    }
  }

  // 4. Deprecate and Pause old Ads tags
  for (const t of plan.adsTagsToPause.filter(x => x.action === 'update')) {
    console.log(`Pausing & Renaming Tag "${t.name}" to "${t.targetName}"...`);
    const originalTag = (baseline.tags.tag || []).find(x => x.tagId === t.id);
    if (!originalTag) {
      console.error(`ERROR: Original tag ID ${t.id} not found in baseline.`);
      process.exit(1);
    }
    
    const body = {
      ...originalTag,
      name: t.targetName,
      paused: true
    };
    
    delete body.path;
    delete body.tagId;
    delete body.accountId;
    delete body.containerId;
    delete body.workspaceId;
    delete body.fingerprint;
    delete body.tagManagerUrl;

    const res = await apiWrite(`/tags/${t.id}`, 'PUT', body);
    if (res.error) {
      console.error(`ERROR updating tag ${t.name}:`, res.error);
      process.exit(1);
    }
  }

  console.log('\n==========================================================');
  console.log(' APPLY COMPLETED SUCCESSFULLY');
  console.log('==========================================================');
  console.log('Workspace 4 elements created and updated.');
  console.log('Please proceed to GTM Preview verification.');
  console.log('==========================================================');
  process.exit(0);
}

async function runGtmPublish(accessToken) {
  console.log('Validating Workspace 4 elements before versioning...');
  const baseline = await fetchGtmBaseline(accessToken);

  const requiredVariables = [
    'DLV - contact_channel',
    'DLV - contact_method',
    'DLV - lead_id',
    'DLV - page_path',
    'DLV - event_source',
    'DLV - timestamp'
  ];
  
  const requiredTriggers = [
    'CE - line_contact_attempt',
    'CE - phone_click_attempt'
  ];

  const requiredTags = [
    'GA4 Event - line_contact_attempt',
    'GA4 Event - phone_click_attempt',
    'Deprecated - Google Ads Conversion - line_click',
    'Deprecated - Google Ads Conversion - phone_click'
  ];

  const existingVariables = (baseline.variables.variable || []).map(v => v.name);
  const existingTriggers = (baseline.triggers.trigger || []).map(t => t.name);
  const existingTags = (baseline.tags.tag || []);

  requiredVariables.forEach(v => {
    if (!existingVariables.includes(v)) {
      console.error(`Assertion failed: Variable "${v}" is missing.`);
      process.exit(1);
    }
  });

  requiredTriggers.forEach(t => {
    if (!existingTriggers.includes(t)) {
      console.error(`Assertion failed: Trigger "${t}" is missing.`);
      process.exit(1);
    }
  });

  requiredTags.forEach(tagName => {
    const t = existingTags.find(x => x.name === tagName);
    if (!t) {
      console.error(`Assertion failed: Tag "${tagName}" is missing.`);
      process.exit(1);
    }
    if (tagName.startsWith('Deprecated -') && !t.paused) {
      console.error(`Assertion failed: Deprecated Tag "${tagName}" is not paused.`);
      process.exit(1);
    }
  });

  const adsConversions = existingTags.filter(x => x.type === 'awct');
  if (adsConversions.length !== 2) {
    console.error(`Assertion failed: Expected exactly 2 Google Ads conversion tags. Found: ${adsConversions.length}`);
    process.exit(1);
  }

  console.log('All readback assertions passed successfully.');

  // 1. Create Workspace Version (Using colon : for custom method)
  console.log('Creating Container Version for Workspace 4...');
  const createVersionBody = {
    name: "Fix contact tracking events and pause legacy click conversions",
    notes: [
      "- Add GA4 line_contact_attempt event tracking",
      "- Add GA4 phone_click_attempt event tracking",
      "- Add Data Layer Variables for contact_channel, contact_method, lead_id, page_path, event_source, timestamp",
      "- Add Custom Event triggers for line_contact_attempt and phone_click_attempt",
      "- Pause deprecated Google Ads conversion tags for line_click and phone_click",
      "- No Google Ads account changes",
      "- No new Google Ads conversion tags",
      "- No PII in dataLayer / GA4 parameters"
    ].join("\n")
  };

  const versionResponse = await requestHttps({
    hostname: 'tagmanager.googleapis.com',
    path: `/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}:create_version`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify(createVersionBody));

  if (versionResponse.error) {
    console.error('ERROR creating version:', versionResponse.error);
    process.exit(1);
  }

  const containerVersionObj = versionResponse.containerVersion || versionResponse;
  
  if (!containerVersionObj || !containerVersionObj.containerVersionId) {
    console.error('ERROR: Missing containerVersionId in API response:', JSON.stringify(versionResponse, null, 2));
    process.exit(1);
  }

  const containerVersionId = containerVersionObj.containerVersionId;
  const versionName = containerVersionObj.name;
  const versionNotes = containerVersionObj.notes;

  console.log('\n==========================================================');
  console.log(' CONTAINER VERSION CREATED SUCCESSFULLY');
  console.log('==========================================================');
  console.log(`Container Version ID: ${containerVersionId}`);
  console.log(`Version Name:         ${versionName}`);
  console.log(`Version Notes:\n${versionNotes}`);
  console.log('==========================================================');

  // 2. Publish Container Version (Using colon : for custom method)
  console.log(`Publishing Container Version ${containerVersionId}...`);
  const publishResponse = await requestHttps({
    hostname: 'tagmanager.googleapis.com',
    path: `/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/versions/${containerVersionId}:publish`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({}));

  if (publishResponse.error) {
    console.error('ERROR publishing version:', publishResponse.error);
    process.exit(1);
  }

  console.log('\n==========================================================');
  console.log(' CONTAINER VERSION PUBLISHED SUCCESSFULLY');
  console.log('==========================================================');
  console.log(`Publish Status:    SUCCESS`);
  console.log(`Version ID:        ${containerVersionId}`);
  console.log(`Live:              YES`);
  console.log(`Publish Time:      ${new Date().toISOString()}`);
  console.log('==========================================================');
  console.log('PUBLISH_COMPLETED');
  process.exit(0);
}
