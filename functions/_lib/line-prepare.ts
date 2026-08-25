import {
  validateAttributionPayload,
  type NormalizedAttributionPayload,
  type ValidationFailure,
} from "./attribution.ts";
import { isUuidV4 } from "./lead-token.ts";

export interface LinePreparePayload {
  request_id: string;
  attribution: NormalizedAttributionPayload | null;
}

export interface LinePrepareValidationSuccess {
  ok: true;
  value: LinePreparePayload;
}

export type LinePrepareValidationResult =
  | LinePrepareValidationSuccess
  | ValidationFailure;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const validateLinePreparePayload = (
  value: unknown
): LinePrepareValidationResult => {
  if (!isRecord(value)) return { ok: false, code: "INVALID_PAYLOAD" };

  const allowedKeys = ["request_id", "attribution"];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return { ok: false, code: "UNSUPPORTED_FIELD" };
  }

  if (!isUuidV4(value.request_id)) {
    return { ok: false, code: "INVALID_REQUEST_ID" };
  }

  if (value.attribution === null) {
    return {
      ok: true,
      value: { request_id: value.request_id, attribution: null },
    };
  }

  const attribution = validateAttributionPayload(value.attribution);
  if (!attribution.ok) return attribution;

  return {
    ok: true,
    value: { request_id: value.request_id, attribution: attribution.value },
  };
};
