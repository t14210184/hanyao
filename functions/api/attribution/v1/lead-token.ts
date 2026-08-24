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

  try {
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
