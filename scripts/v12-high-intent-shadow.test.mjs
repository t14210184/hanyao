import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  analyzeHighIntentMessage,
  classifyHighIntentText,
  normalizeEmailForGoogle,
  normalizeTaiwanMobileForGoogle,
} from "../functions/_lib/high-intent-signal.ts";
import {
  cleanupExpiredLeadUserIdentifiers,
  ensureHighIntentShadowSchema,
  persistHighIntentShadowSafely,
} from "../functions/_lib/high-intent-shadow.ts";

const migrationPath = "migrations/0013_high_intent_signal_shadow.sql";

class SqliteD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async first() {
    return this.db.prepare(this.sql).get(...this.args) ?? null;
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.args);
    return {
      success: true,
      meta: { changes: Number(result.changes ?? 0) },
      results: [],
    };
  }
}

const sqliteD1 = (db) => ({
  prepare(sql) {
    return new SqliteD1Statement(db, sql);
  },
  async batch(statements) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  },
});

const sha = async (value) => {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
};

test("S01/S02/S03 high-intent classifier boundaries", () => {
  assert.deepEqual(classifyHighIntentText("冷氣不冷"), {
    ruleVersion: "v1",
    serviceSignal: true,
    transactionIntentSignal: false,
    locationSignal: false,
    scheduleSignal: false,
    contactSignal: false,
    qualifiedCandidate: false,
  });

  const strong = classifyHighIntentText(
    "冷氣不冷，明天下午可以來鳳山估價嗎？"
  );
  assert.equal(strong.serviceSignal, true);
  assert.equal(strong.transactionIntentSignal, true);
  assert.equal(strong.locationSignal, true);
  assert.equal(strong.scheduleSignal, true);
  assert.equal(strong.qualifiedCandidate, true);

  assert.equal(classifyHighIntentText("你們在哪？").qualifiedCandidate, false);
});

test("S05/S06/S07 identifier normalization is deterministic and privacy-safe", async () => {
  assert.equal(
    normalizeEmailForGoogle("User.Name+promo@gmail.com"),
    "username@gmail.com"
  );
  assert.equal(
    normalizeTaiwanMobileForGoogle("0912-345-678"),
    "+886912345678"
  );
  assert.equal(
    normalizeTaiwanMobileForGoogle("+886912345678"),
    "+886912345678"
  );

  const analysis = await analyzeHighIntentMessage(
    "冷氣不冷，明天下午到鳳山估價，請聯絡 User.Name+promo@gmail.com 或 0912-345-678"
  );

  assert.equal(analysis.classification.qualifiedCandidate, true);
  assert.equal(analysis.classification.contactSignal, true);
  assert.equal(analysis.identifiers.length, 2);
  assert.equal(
    analysis.identifiers.find((x) => x.type === "EMAIL_SHA256")?.hash,
    await sha("username@gmail.com")
  );
  assert.equal(
    analysis.identifiers.find((x) => x.type === "PHONE_SHA256")?.hash,
    await sha("+886912345678")
  );
  for (const identifier of analysis.identifiers) {
    assert.match(identifier.hash, /^[0-9a-f]{64}$/);
  }
  const serialized = JSON.stringify(analysis);
  assert.doesNotMatch(serialized, /User\.Name|0912-345-678|username@gmail\.com/);
});

test("HQ02 migration replays idempotently and enforces shadow constraints", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE lead_tokens (lead_token TEXT PRIMARY KEY);
    CREATE TABLE line_events (line_event_id TEXT PRIMARY KEY);
  `);

  const migration = await readFile(migrationPath, "utf8");
  db.exec(migration);
  db.exec(migration);

  for (const table of [
    "lead_signal_observations",
    "lead_user_identifiers",
    "message_asset_metrics_daily",
  ]) {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    assert.equal(row?.name, table);
  }

  db.prepare("INSERT INTO line_events(line_event_id) VALUES (?)").run("le-1");
  db.prepare("INSERT INTO lead_tokens(lead_token) VALUES (?)").run("HY-1");

  db.prepare(`
    INSERT INTO lead_signal_observations (
      observation_id,line_event_id,line_user_key,lead_token,observed_at,
      rule_version,match_status,attribution_lane,service_signal,
      transaction_intent_signal,location_signal,schedule_signal,
      contact_signal,qualified_candidate,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    "obs-1","le-1","lu-1","HY-1","2026-09-20T00:00:00.000Z",
    "v1","MATCHED_ADS","EXACT_CLICK",1,1,1,0,0,1,
    "2026-09-20T00:00:00.000Z"
  );

  assert.throws(() => {
    db.prepare(`
      INSERT INTO lead_signal_observations (
        observation_id,line_event_id,line_user_key,observed_at,rule_version,
        match_status,attribution_lane,created_at
      ) VALUES (?,?,?,?,?,?,?,?)
    `).run(
      "obs-2","le-1","lu-1","2026-09-20T00:00:01.000Z",
      "v1","MATCHED_ADS","EXACT_CLICK","2026-09-20T00:00:01.000Z"
    );
  }, /UNIQUE/);

  assert.throws(() => {
    db.prepare(`
      INSERT INTO lead_user_identifiers (
        identifier_id,line_user_key,identifier_type,identifier_hash,
        source_line_event_id,first_seen_at,created_at
      ) VALUES (?,?,?,?,?,?,?)
    `).run(
      "id-1","lu-1","EMAIL_SHA256","abc","le-1",
      "2026-09-20T00:00:00.000Z","2026-09-20T00:00:00.000Z"
    );
  }, /CHECK/);
});

test("HQ02 runtime only verifies the additive shadow schema after migration replay", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE lead_tokens (lead_token TEXT PRIMARY KEY);
    CREATE TABLE line_events (line_event_id TEXT PRIMARY KEY);
    CREATE TABLE business_conversions (
      business_conversion_id TEXT PRIMARY KEY,
      subject_kind TEXT NOT NULL,
      subject_key TEXT
    );
    CREATE TABLE attribution_sessions (
      session_id TEXT PRIMARY KEY,
      first_gclid TEXT,
      last_gclid TEXT,
      first_gbraid TEXT,
      last_gbraid TEXT,
      first_wbraid TEXT,
      last_wbraid TEXT,
      expires_at TEXT
    );
    INSERT INTO lead_tokens(lead_token) VALUES ('HY-KEEP');
    INSERT INTO line_events(line_event_id) VALUES ('LE-KEEP');
  `);
  db.exec(await readFile("migrations/0013_high_intent_signal_shadow.sql", "utf8"));
  db.exec(await readFile("migrations/0014_enhanced_user_data_snapshot.sql", "utf8"));
  db.exec(await readFile("migrations/0015_v11_observability_hardening.sql", "utf8"));
  const d1 = sqliteD1(db);

  await ensureHighIntentShadowSchema(d1);
  await ensureHighIntentShadowSchema(d1);

  for (const table of [
    "lead_signal_observations",
    "lead_user_identifiers",
    "message_asset_metrics_daily",
  ]) {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    assert.equal(row?.name, table);
  }
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM lead_tokens").get().c,
    1
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM line_events").get().c,
    1
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM lead_signal_observations").get().c,
    0
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM lead_user_identifiers").get().c,
    0
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM message_asset_metrics_daily").get().c,
    0
  );
});

test("HQ06 retention cleanup removes only expired identifiers not referenced by snapshots", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE lead_tokens (lead_token TEXT PRIMARY KEY);
    CREATE TABLE line_events (line_event_id TEXT PRIMARY KEY);
    CREATE TABLE business_conversions (
      business_conversion_id TEXT PRIMARY KEY,
      subject_kind TEXT NOT NULL,
      subject_key TEXT
    );
    CREATE TABLE attribution_sessions (
      session_id TEXT PRIMARY KEY,
      first_gclid TEXT,
      last_gclid TEXT,
      first_gbraid TEXT,
      last_gbraid TEXT,
      first_wbraid TEXT,
      last_wbraid TEXT,
      expires_at TEXT
    );
    INSERT INTO line_events(line_event_id) VALUES ('LE-RETENTION');
    INSERT INTO business_conversions(business_conversion_id, subject_kind, subject_key)
      VALUES ('BC-RETENTION', 'LINE_USER_HMAC', 'lu_retention');
  `);
  db.exec(await readFile("migrations/0013_high_intent_signal_shadow.sql", "utf8"));
  db.exec(await readFile("migrations/0014_enhanced_user_data_snapshot.sql", "utf8"));
  db.exec(await readFile("migrations/0015_v11_observability_hardening.sql", "utf8"));

  db.prepare(`
    INSERT INTO lead_user_identifiers (
      identifier_id, line_user_key, identifier_type, identifier_hash,
      source_line_event_id, first_seen_at, expires_at, retention_policy_version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "id-expired-free",
    "lu_retention",
    "EMAIL_SHA256",
    "d".repeat(64),
    "LE-RETENTION",
    "2026-01-01T00:00:00.000Z",
    "2026-02-01T00:00:00.000Z",
    "v1",
    "2026-01-01T00:00:00.000Z"
  );
  db.prepare(`
    INSERT INTO lead_user_identifiers (
      identifier_id, line_user_key, identifier_type, identifier_hash,
      source_line_event_id, first_seen_at, expires_at, retention_policy_version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "id-expired-referenced",
    "lu_retention",
    "PHONE_SHA256",
    "e".repeat(64),
    "LE-RETENTION",
    "2026-01-01T00:00:00.000Z",
    "2026-02-01T00:00:00.000Z",
    "v1",
    "2026-01-01T00:00:00.000Z"
  );
  db.prepare(`
    INSERT INTO conversion_user_data_snapshots (
      business_conversion_id, line_user_key, snapshot_version,
      snapshotted_at, sealed_at, consent_state, consent_policy_version, created_at
    ) VALUES (?, ?, 1, ?, ?, 'UNSPECIFIED', 'v1', ?)
  `).run(
    "BC-RETENTION",
    "lu_retention",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z"
  );
  db.prepare(`
    INSERT INTO conversion_user_data_snapshot_items (
      business_conversion_id, identifier_type, identifier_hash,
      source_line_event_id, first_seen_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    "BC-RETENTION",
    "PHONE_SHA256",
    "e".repeat(64),
    "LE-RETENTION",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z"
  );

  const removed = await cleanupExpiredLeadUserIdentifiers(
    sqliteD1(db),
    "2026-03-01T00:00:00.000Z",
    10
  );
  assert.equal(removed, 1);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM lead_user_identifiers WHERE identifier_id='id-expired-free'").get().c,
    0
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS c FROM lead_user_identifiers WHERE identifier_id='id-expired-referenced'").get().c,
    1
  );
});

test("C03 shadow classifier failure is observable and never throws into canonical caller", async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    const db = new DatabaseSync(":memory:");
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE lead_tokens (lead_token TEXT PRIMARY KEY);
      CREATE TABLE line_events (line_event_id TEXT PRIMARY KEY);
    `);
    const result = await persistHighIntentShadowSafely(
      sqliteD1(db),
      {
        lineEventId: "le-failure",
        lineUserKey: "lu_v1_shadow",
        leadToken: null,
        matchStatus: "UNMATCHED",
        exactAdsAttribution: false,
        messageText: "冷氣不冷，明天下午可以來鳳山估價嗎？",
        observedAt: "2026-09-20T00:00:00.000Z",
      },
      async () => {
        throw new Error("INJECTED_CLASSIFIER_FAILURE");
      }
    );
    assert.equal(result, "FAILED");
    assert.equal(warnings.length, 1);
    const serialized = JSON.stringify(warnings);
    assert.match(serialized, /HANYAO_HIGH_INTENT_SHADOW_FAILED/);
    assert.doesNotMatch(serialized, /冷氣不冷|INJECTED_CLASSIFIER_FAILURE/);
  } finally {
    console.warn = originalWarn;
  }
});
