-- Rebuild the child table so expiry cleanup nulls attribution linkage without
-- deleting durable lead-token lifecycle records.
CREATE TABLE lead_tokens_v2 (
  lead_token TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  session_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('line', 'phone', 'form')),
  status TEXT NOT NULL DEFAULT 'issued',
  server_created_at TEXT NOT NULL,
  FOREIGN KEY (session_id)
    REFERENCES attribution_sessions (session_id)
    ON DELETE SET NULL
);

INSERT INTO lead_tokens_v2 (
  lead_token, request_id, session_id, channel, status, server_created_at
)
SELECT
  lead_token, request_id, session_id, channel, status, server_created_at
FROM lead_tokens;

DROP TABLE lead_tokens;
ALTER TABLE lead_tokens_v2 RENAME TO lead_tokens;

CREATE INDEX idx_lead_tokens_request_id
  ON lead_tokens (request_id);

CREATE INDEX idx_lead_tokens_session_id
  ON lead_tokens (session_id);
