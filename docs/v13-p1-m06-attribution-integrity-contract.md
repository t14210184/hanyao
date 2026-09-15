# HANYAO v1.3 P1-M06 attribution integrity contract

P1-M06 bounds client-supplied attribution metadata. It does not prove that a click identifier was issued by Google, and it does not authorize any Production deployment.

## Server timing boundary

- The server processing time is the authoritative received-at clock for the request.
- A source-bearing client touch older than the active 90-day attribution retention window is rejected.
- A client timestamp more than five minutes ahead of server time is rejected.
- A timestamp within the bounded five-minute clock-skew allowance is clamped to server received time before it can participate in last-touch ordering.
- A source-bearing touch with no capture timestamp is degraded to unattributed source data instead of being allowed to become canonical Google Ads attribution.
- First-touch time may not be later than last-touch time in the same submitted payload.

The five-minute allowance is a HANYAO clock-skew policy, not a Google Ads guarantee.

## Click identifier boundary

`gclid`, `gbraid`, and `wbraid` remain opaque strings. P1-M06 only rejects whitespace/control-character forms that are unsafe as canonical identifiers. It does not infer semantic validity from a regex.

During the active retention window, the same non-null click identifier may not be asserted under another client `session_id`. The server checks existing active attribution sessions before accepting the new assertion. Reuse after the local retention window is not treated as proof of authenticity either.

## Evidence semantics

`attribution_snapshot_hash` proves only that the server-frozen snapshot has not changed since issuance. The snapshot, bounded timestamp, same-origin request, SQL parameterization, and rate limiting do not prove that the browser received a genuine Google Ads click.

Canonical E2E attribution still requires a naturally occurring event and the existing Google Ads/Data Manager/reporting evidence chain. No fake click ID may be generated to satisfy this contract.

## Production boundary

This patch adds no D1 schema and changes no Production data, Secret, Pages deployment, Worker deployment, Google Ads goal, bid, or budget. Production rollout remains a separate Human Gate.
