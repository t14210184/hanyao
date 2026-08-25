import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
} from "../../_lib/http";
import {
  MAX_LINE_WEBHOOK_BODY_BYTES,
  parseLineWebhookPayload,
  processLineWebhookEvent,
  readRawRequestBody,
  verifyLineSignature,
} from "../../_lib/line-webhook";
import type { PageHandler } from "../../_lib/types";

const summarizeOutcomes = (
  outcomes: Array<"accepted" | "duplicate" | "ignored">
): "accepted" | "duplicate" | "ignored" => {
  if (outcomes.includes("accepted")) return "accepted";
  if (outcomes.includes("ignored")) return "ignored";
  return "duplicate";
};

export const onRequest: PageHandler = async ({ request, env }) => {
  if (request.method !== "POST") return methodNotAllowed();

  const channelSecret = env.LINE_CHANNEL_SECRET?.trim();
  if (!channelSecret) {
    return errorResponse("WEBHOOK_NOT_CONFIGURED", 503);
  }

  const body = await readRawRequestBody(
    request,
    MAX_LINE_WEBHOOK_BODY_BYTES
  );
  if (!body.ok) return errorResponse(body.code, body.status);

  const signature = request.headers.get("x-line-signature");
  if (!signature) return errorResponse("SIGNATURE_MISSING", 401);
  if (!(await verifyLineSignature(body.bytes, signature, channelSecret))) {
    return errorResponse("SIGNATURE_INVALID", 401);
  }

  const payload = parseLineWebhookPayload(body.bytes);
  if (!payload.ok) return errorResponse(payload.code, 400);
  if (payload.value.events.length === 0) {
    return jsonResponse({ status: "accepted" });
  }

  try {
    const outcomes: Array<"accepted" | "duplicate" | "ignored"> = [];
    for (const event of payload.value.events) {
      outcomes.push(await processLineWebhookEvent(env.ATTRIBUTION_DB, event));
    }
    return jsonResponse({ status: summarizeOutcomes(outcomes) });
  } catch {
    return errorResponse("INTERNAL_ERROR", 500);
  }
};
