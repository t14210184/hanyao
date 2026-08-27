# `google-ads-uploader`

Dedicated server-side scheduled Worker module for LINE4A. It exports a
`scheduled()` handler and intentionally has no public upload `fetch()` route.
The tracked Wrangler configuration is a local/preview template only: this
stage does not deploy it, create a remote Cron, bind remote D1, or write a
Cloudflare secret.

Local tests use Wrangler local D1 state and the scheduled test route. The
service-account secret is intentionally absent from the tracked configuration.
