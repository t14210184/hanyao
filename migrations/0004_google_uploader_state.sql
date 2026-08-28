-- LINE4A: extend the existing conversion_outbox in place. No second outbox
-- table is introduced; historical rows and the existing transaction IDs are
-- preserved while adding bounded submission/diagnostic state.
PRAGMA foreign_keys = OFF;

CREATE TABLE conversion_outbox_v4 (
  conversion_id TEXT PRIMARY KEY NOT NULL,
  lead_token TEXT NOT NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type = 'verified_line_contact'),
  event_timestamp TEXT NOT NULL,
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  attribution_touch TEXT CHECK (attribution_touch IN ('last', 'first')),
  transaction_id TEXT NOT NULL UNIQUE,
  destination_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'processing',
      'validated_only',
      'submitted',
      'success',
      'failed',
      'deduplicated',
      'sent'
    )
  ),
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  submitted_at TEXT,
  google_request_id TEXT,
  next_diagnostic_at TEXT,
  terminal_result TEXT,
  last_error_reason TEXT,
  diagnostic_status TEXT,
  diagnostic_record_count INTEGER,
  diagnostic_error_reason TEXT,
  diagnostic_attempt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE (lead_token, conversion_type),
  FOREIGN KEY (lead_token)
    REFERENCES lead_tokens (lead_token)
    ON DELETE RESTRICT
);

INSERT INTO conversion_outbox_v4 (
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  updated_at
)
SELECT
  conversion_id, lead_token, conversion_type, event_timestamp, gclid, gbraid,
  wbraid, attribution_touch, transaction_id, destination_key, status,
  retry_count, next_retry_at, last_error_code, created_at, sent_at,
  COALESCE(sent_at, created_at)
FROM conversion_outbox;

DROP TABLE conversion_outbox;
ALTER TABLE conversion_outbox_v4 RENAME TO conversion_outbox;

CREATE INDEX idx_conversion_outbox_status_next_retry
  ON conversion_outbox (status, next_retry_at, created_at);

CREATE INDEX idx_conversion_outbox_status
  ON conversion_outbox (status);

CREATE INDEX idx_conversion_outbox_next_retry_at
  ON conversion_outbox (next_retry_at);

CREATE INDEX idx_conversion_outbox_lead_token
  ON conversion_outbox (lead_token);

CREATE INDEX idx_conversion_outbox_diagnostic_due
  ON conversion_outbox (status, next_diagnostic_at, submitted_at);

CREATE INDEX idx_conversion_outbox_google_request_id
  ON conversion_outbox (google_request_id);

PRAGMA foreign_keys = ON;
