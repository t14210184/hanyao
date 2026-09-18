# HANYAO WP05 LINE Message Asset UI Execution Contract — 2026-09-18

Status: `UI_EXECUTION_CONTRACT_PRODUCTION_SOURCE_PASS / PUBLIC_API_RECHECKED_20260918 / PROVIDER_UI_AUTH_PENDING / MESSAGE_ASSET_NOT_APPLIED`

Scope: `HANYAO_ADS_WEBSITE_OPTIMIZATION_CONSTRUCTION_SPEC_v1.0_20260917` WP05 only.

## 1. Why this contract exists

Fresh official recheck on 2026-09-18 confirms that the public Google Ads API
provider enum still does not include LINE. The v25 public provider surface is
`WHATSAPP / FACEBOOK_MESSENGER / ZALO`; the current v25.1 release does not add
a LINE provider. Google also lists Crescendo Lab as an official message-asset
partner serving Taiwan. That partner route may assist implementation, but it
does not replace account-specific authenticated UI evidence or the same-source
post-save readback required by this contract.

Google Ads API v25 does not expose LINE in the public Business Message provider
enum, while the HANYAO account UI has historically exposed `Line` and
`Line ID`. Therefore the LINE Message Asset pilot cannot be safely manufactured
through an undocumented API payload.

The only legal Production route remains:

```text
fresh authenticated Google Ads UI prestate
→ machine-normalized evidence
→ exact prestate hash
→ WP05 dispatch gate
→ one bounded UI save/association
→ fresh same-source UI poststate
→ machine validation
→ ACTIVE_PASS / SAVED_PENDING_REVIEW / BLOCKED
```

This repository increment does **not** automate clicks in the Google Ads UI and
does not claim that a Message Asset was created.

## 2. Evidence contract

Repository files:

```text
scripts/ads-line-message-ui-execution-contract.ts
scripts/ads-line-message-ui-evidence.ts
scripts/ads-line-message-ui-execution-contract.test.ts
scripts/ads-line-message-ui-execution-static.test.mjs
```

The evidence checker accepts normalized JSON captured from the authenticated
Google Ads UI.

### Required prestate

```text
customer_id = 4801404246
campaign = 冷氣維修
campaign enabled
advertiser verification complete
Message Asset Beta eligible
Line platform field visible
Line ID field visible
platform = Line
Line ID = @451vpomq
current bidding strategy
campaign optimization-set fingerprint
current call/lead-form association fingerprint
HY - Verified LINE Contact exact snapshot
current message-asset inventory
```

Canonical HY snapshot must remain:

```text
conversion_action_id = 7674301565
name = HY - Verified LINE Contact
primary = false
counting = MANY_PER_CLICK
```

Prestate evidence older than 30 minutes is rejected by default.

## 3. Frozen state

The following values are hashed before dispatch and must remain unchanged after
the bounded UI action:

```text
customer ID
campaign ID/name/status
bidding strategy
campaign optimization set
call / lead-form associations
HY canonical action identity / Primary state / counting
```

Any drift yields `WP05_MESSAGE_ASSET_BLOCKED`.

## 4. Exact asset identity

Allowed LINE identity:

```text
platform = Line
Line ID = @451vpomq
association scope = CAMPAIGN
association campaign = exact 冷氣維修 campaign
association status = ENABLED / ACTIVE
```

Allowed starter messages remain the two already-reviewed WP05 candidates:

```text
您好，我的冷氣有問題，想先傳照片或症狀請協助判斷。
您好，我想詢問冷氣維修，稍後會傳照片與所在地區，請協助評估。
```

A different LINE ID, unsupported message, account, campaign, or association
scope is rejected.

## 5. Review state is not activation

After save, policy and platform verification may be asynchronous.

If the exact asset exists and all frozen state is preserved but either provider
review is still pending, the only legal verdict is:

```text
WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW
```

This is not equivalent to:

```text
MESSAGE_ASSET_PILOT_ACTIVE=PASS
```

Only when both policy approval and messaging verification are normalized as
complete may the evidence checker return:

```text
WP05_MESSAGE_ASSET_ACTIVE_PASS
```

## 6. Dispatch gate

The UI action must be bound to the exact fresh prestate:

```text
ADS_MESSAGE_UI_PRODUCTION_GATE=HANYAO_WP05_LINE_UI_APPROVED_20260918
ADS_MESSAGE_UI_EXPECTED_PRESTATE_HASH=<exact SHA-256>
```

The checker can verify those values before an authenticated UI executor is
allowed to save.

The current Chat execution surface has no authenticated Google Ads browser or
Google Ads connector. Therefore the dispatch itself remains
`PROVIDER_UI_AUTH_PENDING`; this contract does not convert unavailable
authorization into a false Production PASS.

## 7. Same-source poststate

Poststate must be captured from the Google Ads UI after the save and include:

```text
exact asset resource/identity
Line / @451vpomq
starter message
campaign association
association status
policy approval status
verification status
fresh copies of all frozen prestate values
```

Then run:

```bash
node --experimental-strip-types scripts/ads-line-message-ui-evidence.ts \
  --pre /path/to/wp05-prestate.json \
  --post /path/to/wp05-poststate.json
```

For pre-dispatch gate verification:

```bash
ADS_MESSAGE_UI_PRODUCTION_GATE=HANYAO_WP05_LINE_UI_APPROVED_20260918 \
ADS_MESSAGE_UI_EXPECTED_PRESTATE_HASH=<hash> \
node --experimental-strip-types scripts/ads-line-message-ui-evidence.ts \
  --pre /path/to/wp05-prestate.json \
  --assert-dispatch
```

The checker is evidence-only:

```text
browser automation = 0
Google Ads API mutation = 0
Google Ads UI mutation = 0
mutationApplied = false
```

## 8. Rollback contract

If the pilot must be stopped because of policy problems, irrelevant chats,
call-lead cannibalization, or tracking/goal contamination, rollback targets
only the exact associated Message Asset:

```text
operation = DISASSOCIATE_EXACT_MESSAGE_ASSET
preserve asset history = true
preserve reporting history = true
restore frozen bidding/optimization state
mutate HY canonical conversion = false
mutate budget = false
mutate keywords = false
```

The contract intentionally does not delete historical provider evidence.

## 9. Stop conditions

Do not proceed or remain active if any of these occur:

```text
Advertiser Verification incomplete
LINE Beta no longer available
Line / Line ID UI fields absent
Line ID != @451vpomq
UI requires bidding-strategy change
campaign optimization set changes
call/lead-form associations are modified by setup
HY action identity / Secondary / MANY drifts
asset policy disapproved
LINE verification fails
provider state is ambiguous or stale
```

## 10. Frozen boundaries

This WP05 execution contract does not modify:

```text
budget
bidding strategy
keywords / negative keywords
HY - Verified LINE Contact identity or Primary status
GTM / GA4
D1 / uploader
broad match
AI Max
```

Lane B Message Asset reporting remains separate from Lane A
`HY - Verified LINE Contact`.

## 11. Current truthful state

```text
WP05_CANDIDATE = PRODUCTION_SOURCE_PASS
WP05_API_READONLY_PREFLIGHT = PRODUCTION_SOURCE_PASS
WP05_UI_EXECUTION_CONTRACT = PRODUCTION_SOURCE_PASS
WP05_PUBLIC_API_PROVIDER_RECHECK = PASS_20260918
WP05_TAIWAN_OFFICIAL_PARTNER_ROUTE = AVAILABLE_NOT_ENGAGED
WP05_AUTHENTICATED_UI_PRESTATE = NOT_AVAILABLE_IN_CURRENT_CHAT
WP05_MESSAGE_ASSET_MUTATION = NOT_APPLIED
WP05_MESSAGE_ASSET_PILOT_ACTIVE = NOT_YET
```
