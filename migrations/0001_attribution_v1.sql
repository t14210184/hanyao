CREATE TABLE IF NOT EXISTS attribution_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  schema_version INTEGER NOT NULL,
  first_captured_at TEXT,
  first_landing_path TEXT,
  first_referrer_origin TEXT,
  first_gclid TEXT,
  first_gbraid TEXT,
  first_wbraid TEXT,
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT,
  first_utm_id TEXT,
  first_utm_term TEXT,
  first_utm_content TEXT,
  last_captured_at TEXT,
  last_landing_path TEXT,
  last_referrer_origin TEXT,
  last_gclid TEXT,
  last_gbraid TEXT,
  last_wbraid TEXT,
  last_utm_source TEXT,
  last_utm_medium TEXT,
  last_utm_campaign TEXT,
  last_utm_id TEXT,
  last_utm_term TEXT,
  last_utm_content TEXT,
  server_created_at TEXT NOT NULL,
  server_updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attribution_sessions_expires_at
  ON attribution_sessions (expires_at);

CREATE TABLE IF NOT EXISTS lead_tokens (
  lead_token TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  session_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('line', 'phone', 'form')),
  status TEXT NOT NULL DEFAULT 'issued',
  server_created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES attribution_sessions (session_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tokens_request_id
  ON lead_tokens (request_id);

CREATE INDEX IF NOT EXISTS idx_lead_tokens_session_id
  ON lead_tokens (session_id);
