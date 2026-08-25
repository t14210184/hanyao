# Client Attribution Trust Model

`POST /api/line/prepare` accepts a client-asserted attribution snapshot so the
first-party site can associate a LINE contact preparation with the browser's
existing attribution session. The server validates the same bounded schema
used by the attribution foundation, stores only normalized landing paths,
referrer origins, click identifiers, UTM fields, timestamps, and the bounded
session identifier, then issues a server-generated `HY-` lead token.

This input is not proof that Google supplied or authorized any value. A user,
browser extension, local-storage editor, replay script, or other client-side
actor can alter or replay the attribution payload. The API therefore does not
accept PII, LINE user identifiers, message text, user-agent data, client IP
data, or provider credentials, and it does not send Google or LINE requests.
The existing allowlist, URL minimization, timestamp ordering, 90-day retention,
same-origin check, body limit, abuse-control hook, and idempotent request key
bound the impact of a false assertion.

The accepted rationale for LINE1B1 is to establish the local first-party
prepare boundary before a later browser stage constructs the LINE OA message.
The resulting token is an operational correlation key, not a verified
conversion. LINE1B-2 must preserve that distinction and must not treat the
client assertion alone as Google Ads conversion evidence.

Future hardening could add a server-signed attribution envelope or another
server-observed claim chain. That is intentionally out of scope for LINE1B1;
no signing key, provider token, Google integration, or schema expansion is
introduced here.
