# `google-ads-uploader`

Dedicated server-side scheduled Worker module for verified LINE conversions.
It exports a `scheduled()` handler and intentionally has no public upload
`fetch()` route.

The tracked Wrangler configuration remains a local/preview template until the
production release gate is explicitly completed. Repository code must not
silently deploy a remote Cron, bind a production D1 database, or write a
Cloudflare secret.

## Reliability model

The production path is intentionally database-backed and idempotent:

1. A verified LINE webhook writes one `conversion_outbox` row with a stable
   `transaction_id`.
2. The uploader claims due `pending` rows using a conditional D1 update.
3. A successful Data Manager `events:ingest` call stores the returned
   `requestId` and schedules diagnostics no earlier than 30 minutes later.
4. `requestStatus:retrieve` drives the terminal result.
5. Duplicate transaction diagnostics are treated as an explicit
   success-equivalent only when they refer to the same local transaction.
6. `PROCESSING_ERROR_REASON_TOO_RECENT_CLICK` is not terminal. Google requires
   retrying once the click is at least six hours old, so the same transaction
   is requeued without changing its identity.
7. Scheduler startup recovers `processing` rows that have been stale for at
   least 30 minutes. Upload claims return to `pending`; diagnostic claims with
   a saved Google request ID return to `submitted`.
8. Data Manager ingestion `fieldWarnings` and diagnostic `warningInfo` are
   surfaced through sanitized Worker logs without turning an otherwise
   successful conversion into a failure.

The transport remains REST + `fetch()` because it is native to Cloudflare
Workers. Google Data Manager client-library schemas and examples are useful as
contract references, but a Node/gRPC dependency is not required for this
Worker.

## Safety invariants

- Production upload remains fail-closed unless the production environment,
  non-validation mode, explicit human gate, destination account/action, D1
  binding, and service-account credential are all present and verified.
- Secrets never belong in tracked Wrangler configuration.
- A retry never invents a replacement `transaction_id`.
- D1 is the local audit ledger; Google Ads reporting is a downstream result,
  not the only record of delivery.
- `line_contact_attempt` remains an observation signal. The uploader handles
  the higher-quality `verified_line_contact` event created only after a real
  LINE message is matched to stored Google Ads attribution.

## Verification

Run:

```bash
npm run test:line4a
npm run typecheck
```

The LINE4A unit suite includes `hardening.test.ts`, which covers Data Manager
field warnings, diagnostic warnings, defensive failure-status normalization,
too-recent-click requeue behavior, and stale-claim recovery SQL.
