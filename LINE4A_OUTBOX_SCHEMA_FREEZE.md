# LINE4A outbox schema freeze

The existing `conversion_outbox` created by migration `0003_line_webhook_foundation.sql`
is the only outbox authority. LINE4A extends that table with migration 0004; it
does not create a second outbox or invent a new attribution schema.

## Frozen lineage and attribution

- Primary key: `conversion_id`.
- LINE linkage: `line_events` is the durable webhook record; the outbox row is
  created by `functions/_lib/line-webhook.ts` only after a `MATCHED_ADS` event.
- Lead/session linkage: `lead_token` is the existing foreign key to
  `lead_tokens`; `lead_tokens.session_id` links to the existing
  `attribution_sessions` record. The outbox does not duplicate session data.
- Stable transaction ID: `transaction_id` is created once at outbox insertion,
  is unique, and is reused for every retry and diagnostic association.
- Event timestamp: `event_timestamp` is the normalized timestamp from the
  signed LINE webhook event (`lineEventTimestamp`), not uploader time.
- Click identifiers: `gclid`, `gbraid`, and `wbraid` are copied from the
  existing `selectGoogleAdsAttribution()` selection. The uploader serializes
  only non-empty values already stored in these columns; it never derives or
  guesses an identifier.

## State, attempt, and time fields

- `status`: `pending`, `processing`, `submitted`, `success`, `failed`, or
  `deduplicated`. Legacy `sent` remains accepted for historical compatibility;
  LINE4A never treats it as a new submission.
- `retry_count`: existing column, incremented by the conditional claim before
  each ingest attempt; maximum is 8.
- `next_retry_at`: durable time for the next bounded ingest attempt.
- `created_at`: existing outbox creation time; `sent_at` is retained as a
  historical field and is not used as proof of provider success.
- `updated_at`: migration 0004 adds the durable mutation timestamp.
- `submitted_at`: time the provider accepted the request and returned a request
  ID.
- `google_request_id`: provider request ID. Only this identifier is persisted;
  bearer tokens and raw provider responses are not.
- `next_diagnostic_at`: durable status-check schedule; first check is at least
  30 minutes after submission, then approximately 1.3x with a 60-minute cap.
- `diagnostic_attempt_count`: bounded by the 24-hour diagnostic timebox.
- `terminal_result`: explicit terminal classification, including
  `SUCCESS`, `PARTIAL_SUCCESS_HUMAN_REVIEW`, and
  `DEDUPLICATED_SUCCESS_EQUIVALENT`.
- `last_error_code` / `last_error_reason`: internal and sanitized provider
  diagnostics only.
- `diagnostic_status`, `diagnostic_record_count`, and
  `diagnostic_error_reason`: sanitized status readback fields.

## Query and concurrency freeze

Ready rows are selected with the existing attribution outbox and bounded by
`status='pending'`, due `next_retry_at`, and `retry_count < 8`. A conditional
`UPDATE ... WHERE status='pending'` claim prevents two scheduled invocations
from processing the same row. Submitted rows are selected separately by
`google_request_id` and due `next_diagnostic_at`; a conditional submitted claim
prevents a diagnostic from being run twice concurrently.
