# HANYAO v1.3 P1-M05 LINE identity key rotation contract

P1-M05 prepares rotation compatibility only. It does not rotate Production secrets or authorize a Production deployment.

## Identity contract

- `LINE_USER_KEY_HMAC_SECRET` remains the current HMAC secret.
- `LINE_USER_KEY_HMAC_KEY_ID` is the explicit current key version; an omitted ID defaults to `v1` for backward compatibility with the existing single-secret deployment.
- `LINE_USER_KEY_HMAC_PREVIOUS_KEY_ID` and `LINE_USER_KEY_HMAC_PREVIOUS_SECRET` are an optional pair used only during a bounded overlap window.
- Current and previous key IDs and secrets must be distinct.
- Raw LINE `userId` is never written to D1; only HMAC-derived `lu_v1_*` pseudonymous keys are persisted.

## Rotation continuity

For a known LINE user, the runtime derives current and previous pseudonymous candidates in memory. Existing webhook-event identity, a lead-token claimant, and an active 30-day business dedupe lock are read as continuity evidence. If exactly one candidate is supported, that key is used for the event and business subject. If current and previous evidence conflict, processing fails closed.

Existing rows whose `identity_key_id` is the legacy literal `current` remain valid during overlap because continuity is verified by the stored pseudonymous subject key. New rows persist an explicit key version such as `v1` or `v2`.

The previous secret must remain available for at least the remaining business-dedupe and provider/webhook replay window. Deleting the previous secret is a separate Production change and requires an independent Production gate.

## P1-M05 acceptance

- Same raw user across a current/previous key overlap resolves to the existing pseudonymous business subject when continuity evidence exists.
- Old webhook redelivery can select the previous key and reproduce the original canonical fingerprint.
- Conflicting current/previous continuity evidence fails closed.
- Incomplete or ambiguous keyring configuration fails closed.
- Raw LINE `userId` never appears in D1 bind arguments.
- No Production secret, D1 data, Pages deployment, Worker deployment, Google Ads setting, or bidding/budget state is changed by this patch.
