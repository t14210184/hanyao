import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  sameOriginRequest,
} from "../../../_lib/http";
import {
  upsertAttributionSession,
  opportunisticCleanupExpiredAttribution,
  validateAttributionPayload,
} from "../../../_lib/attribution";
import {
  ABUSE_CONTROL_RETRY_AFTER_SECONDS,
  enforceAbuseControl,
} from "../../../_lib/abuse-control";
import type { PageHandler } from "../../../_lib/types";

export const onRequest: PageHandler = async ({ request, env }) => {
  if (request.method !== "POST") return methodNotAllowed();
  if (!sameOriginRequest(request)) {
    return errorResponse("ORIGIN_NOT_ALLOWED", 403);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const payload = validateAttributionPayload(body.value);
  if (!payload.ok) return errorResponse(payload.code, 400);

  const abuseDecision = await enforceAbuseControl(
    request,
    env.ATTRIBUTION_RATE_LIMITER
  );
  if (!abuseDecision.allowed) {
    return errorResponse("RATE_LIMITED", 429, {
      retry_after_seconds: ABUSE_CONTROL_RETRY_AFTER_SECONDS,
    });
  }

  try {
    await opportunisticCleanupExpiredAttribution(
      env.ATTRIBUTION_DB,
      payload.value.session_id
    );
    const row = await upsertAttributionSession(env.ATTRIBUTION_DB, payload.value);
    return jsonResponse({
      session_id: row.session_id,
      schema_version: row.schema_version,
      server_created_at: row.server_created_at,
      server_updated_at: row.server_updated_at,
      expires_at: row.expires_at,
    });
  } catch {
    return errorResponse("INTERNAL_ERROR", 500);
  }
};
