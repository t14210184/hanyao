import { exchangeServiceAccountToken } from "../workers/google-ads-uploader/src/auth.ts";
import { buildDataManagerRequest } from "../workers/google-ads-uploader/src/payload.ts";
import { ingestDataManagerEvent } from "../workers/google-ads-uploader/src/provider.ts";
import type {
  ConversionOutboxRow,
  UploaderConfig,
} from "../workers/google-ads-uploader/src/types.ts";

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
if (!credential) {
  console.log("GOOGLE_DATA_MANAGER_DESTINATION=SKIPPED_NO_GITHUB_CREDENTIAL");
  process.exit(0);
}

const now = new Date();
const iso = now.toISOString();
const row: ConversionOutboxRow = {
  conversion_id: "line4b-preflight",
  lead_token: "HY-LINE4B-PREFLIGHT",
  conversion_type: "verified_line_contact",
  event_timestamp: iso,
  gclid: "HANYAO_LINE4B_VALIDATE_ONLY_SYNTHETIC_GCLID",
  gbraid: null,
  wbraid: null,
  attribution_touch: "last",
  transaction_id: `HANYAO-LINE4B-VALIDATE-ONLY-${now.getTime()}`,
  destination_key: "HY_VERIFIED_LINE_CONTACT",
  status: "pending",
  retry_count: 0,
  next_retry_at: null,
  last_error_code: null,
  created_at: iso,
  sent_at: null,
  submitted_at: null,
  google_request_id: null,
  next_diagnostic_at: null,
  terminal_result: null,
  last_error_reason: null,
  diagnostic_status: null,
  diagnostic_record_count: null,
  diagnostic_error_reason: null,
  diagnostic_attempt_count: 0,
  updated_at: iso,
};

const config: UploaderConfig = {
  googleAdsAccountId: "4801404246",
  googleAdsConversionActionId: "7674301565",
  validateOnly: true,
  terminalRetentionDays: null,
};

try {
  const auth = await exchangeServiceAccountToken(credential);
  const request = buildDataManagerRequest(row, config);
  if (!request.validateOnly) throw new Error("VALIDATE_ONLY_NOT_ENFORCED");
  const result = await ingestDataManagerEvent(auth.accessToken, request);
  console.log(
    `GOOGLE_DATA_MANAGER_DESTINATION=PASS;REQUEST_ID_PRESENT=${result.requestId ? "TRUE" : "FALSE"};FIELD_WARNINGS=${result.fieldWarnings?.length ?? 0}`
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  console.error(`GOOGLE_DATA_MANAGER_DESTINATION=FAIL:${message}`);
  process.exitCode = 1;
}
