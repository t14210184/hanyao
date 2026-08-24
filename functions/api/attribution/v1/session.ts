import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  sameOriginRequest,
} from "../../../_lib/http";
import {
  upsertAttributionSession,
  validateAttributionPayload,
} from "../../../_lib/attribution";
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

  try {
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
