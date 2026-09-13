-- EVIDENCE-RECONSTRUCTED MIGRATION.
-- Original 2026-09-09 SQL was not recoverable. The Production schema shows
-- this migration adds only the bounded attribution abuse-rate state table.
-- Production already records this migration name and MUST NOT re-run it.

CREATE TABLE IF NOT EXISTS attribution_abuse_rate_state (
  client_key_hash TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 1),
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);