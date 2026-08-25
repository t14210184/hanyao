import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  sameOriginRequest,
} from "../../_lib/http";
import {
  ABUSE_CONTROL_RETRY_AFTER_SECONDS,
  enforceAbuseControl,
} from "../../_lib/abuse-control";
import {
  opportunisticCleanupExpiredAttribution,
  upsertAttributionSession,
} from "../../_lib/attribution";
import {
  issueLeadToken,
  LeadTokenIdempotencyConflictError,
  SessionNotFoundError,
} from "../../_lib/lead-token";
import { validateLinePreparePayload } from "../../_lib/line-prepare";
import type { PageHandler } from "../../_lib/types";

export const onRequest: PageHandler = async ({ request, env }) => {
  if (request.method !== "POST") return methodNotAllowed();
  if (!sameOriginRequest(request)) {
    return errorResponse("ORIGIN_NOT_ALLOWED", 403);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const payload = validateLinePreparePayload(body.value);
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
    let sessionId: string | null = null;
    if (payload.value.attribution !== null) {
      await opportunisticCleanupExpiredAttribution(
        env.ATTRIBUTION_DB,
        payload.value.request_id
      );
      const session = await upsertAttributionSession(
        env.ATTRIBUTION_DB,
        payload.value.attribution
      );
      sessionId = session.session_id;
    }

    const result = await issueLeadToken(env.ATTRIBUTION_DB, {
      request_id: payload.value.request_id,
      session_id: sessionId,
      channel: "line",
    });

    return jsonResponse({
      status: "prepared",
      lead_token: result.lead_token,
    });
  } catch (error) {
    if (error instanceof LeadTokenIdempotencyConflictError) {
      return errorResponse("IDEMPOTENCY_CONFLICT", 409);
    }
    if (error instanceof SessionNotFoundError) {
      return errorResponse("SESSION_NOT_FOUND", 404);
    }
    return errorResponse("INTERNAL_ERROR", 500);
  }
};
