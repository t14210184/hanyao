CREATE TABLE IF NOT EXISTS line_events (
  line_event_id TEXT PRIMARY KEY NOT NULL,
  webhook_event_id TEXT NOT NULL UNIQUE,
  message_id TEXT UNIQUE,
  lead_token TEXT,
  event_type TEXT NOT NULL,
  match_status TEXT NOT NULL CHECK (
    match_status IN (
      'MATCHED_ADS',
      'MATCHED_UNATTRIBUTED',
      'UNMATCHED',
      'WRONG_CHANNEL',
      'AMBIGUOUS',
      'IGNORED_NON_TEXT'
    )
  ),
  line_event_timestamp TEXT,
  received_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  line_user_key TEXT,
  FOREIGN KEY (lead_token)
    REFERENCES lead_tokens (lead_token)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_line_events_lead_token
  ON line_events (lead_token);

CREATE INDEX IF NOT EXISTS idx_line_events_match_status
  ON line_events (match_status);

CREATE INDEX IF NOT EXISTS idx_line_events_created_at
  ON line_events (created_at);

CREATE TABLE IF NOT EXISTS conversion_outbox (
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
    status IN ('pending', 'processing', 'sent', 'failed')
  ),
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  UNIQUE (lead_token, conversion_type),
  FOREIGN KEY (lead_token)
    REFERENCES lead_tokens (lead_token)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_conversion_outbox_status
  ON conversion_outbox (status);

CREATE INDEX IF NOT EXISTS idx_conversion_outbox_next_retry_at
  ON conversion_outbox (next_retry_at);

CREATE INDEX IF NOT EXISTS idx_conversion_outbox_lead_token
  ON conversion_outbox (lead_token);
