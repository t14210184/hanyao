import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  sameOriginRequest,
} from "../../../_lib/http";
import {
  issueLeadToken,
  SessionNotFoundError,
  validateLeadTokenRequest,
} from "../../../_lib/lead-token";
import {
  ABUSE_CONTROL_RETRY_AFTER_SECONDS,
  enforceAbuseControl,
} from "../../../_lib/abuse-control";
import { opportunisticCleanupExpiredAttribution } from "../../../_lib/attribution";
import type { PageHandler } from "../../../_lib/types";

export const onRequest: PageHandler = async ({ request, env }) => {
  if (request.method !== "POST") return methodNotAllowed();
  if (!sameOriginRequest(request)) {
    return errorResponse("ORIGIN_NOT_ALLOWED", 403);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const payload = validateLeadTokenRequest(body.value);
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
      payload.value.request_id
    );
    const result = await issueLeadToken(env.ATTRIBUTION_DB, payload.value);
    return jsonResponse({
      lead_token: result.lead_token,
      request_id: result.request_id,
      channel: result.channel,
      server_created_at: result.server_created_at,
    });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return errorResponse("SESSION_NOT_FOUND", 404);
    }
    return errorResponse("INTERNAL_ERROR", 500);
  }
};
