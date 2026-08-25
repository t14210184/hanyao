import type { RateLimitBinding } from "./types";

export const ABUSE_CONTROL_VERSION = "ABUSE_CONTROL_V1" as const;
export const ABUSE_CONTROL_RETRY_AFTER_SECONDS = 60;

export type AbuseControlDecision =
  | {
      allowed: true;
      mode: "fail-open";
      reason: "REMOTE_BINDING_DEFERRED" | "BINDING_ERROR_FAIL_OPEN";
    }
  | {
      allowed: true;
      mode: "binding";
      reason: "ALLOWED";
    }
  | {
      allowed: false;
      mode: "fail-closed";
      reason: "RATE_LIMITED";
    };

const transientClientKey = (request: Request): string => {
  const clientAddress = request.headers.get("CF-Connecting-IP");
  return clientAddress ? `ip:${clientAddress}` : "anonymous-client";
};

/**
 * Local hook for ABUSE_CONTROL_V1. The key is used only by the optional
 * Cloudflare rate-limit binding and is never written to D1.
 */
export const enforceAbuseControl = async (
  request: Request,
  binding?: RateLimitBinding
): Promise<AbuseControlDecision> => {
  if (!binding) {
    return {
      allowed: true,
      mode: "fail-open",
      reason: "REMOTE_BINDING_DEFERRED",
    };
  }

  try {
    const result = await binding.limit(transientClientKey(request));
    if (!result.success) {
      return { allowed: false, mode: "fail-closed", reason: "RATE_LIMITED" };
    }
    return { allowed: true, mode: "binding", reason: "ALLOWED" };
  } catch {
    return {
      allowed: true,
      mode: "fail-open",
      reason: "BINDING_ERROR_FAIL_OPEN",
    };
  }
};
