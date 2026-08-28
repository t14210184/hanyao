import type { PageContext } from "./types";

export const MAX_REQUEST_BODY_BYTES = 16 * 1024;

export interface JsonSuccess {
  ok: true;
  value: unknown;
}

export interface JsonFailure {
  ok: false;
  response: Response;
}

export type JsonBodyResult = JsonSuccess | JsonFailure;

const baseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
  additionalHeaders: Record<string, string> = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders, ...additionalHeaders },
  });

export const errorResponse = (
  code: string,
  status: number,
  additionalBody: Record<string, unknown> = {}
): Response => jsonResponse({ error: code, ...additionalBody }, status);

export const methodNotAllowed = (): Response =>
  errorResponse("METHOD_NOT_ALLOWED", 405, { allowed_methods: ["POST"] });

export const sameOriginRequest = (request: Request): boolean => {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
};
export const readJsonBody = async (
  request: PageContext["request"],
  maxBytes = MAX_REQUEST_BODY_BYTES
): Promise<JsonBodyResult> => {
  const contentType = request.headers.get("Content-Type");
  if (
    !contentType ||
    contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json"
  ) {
    return {
      ok: false,
      response: errorResponse("UNSUPPORTED_MEDIA_TYPE", 415),
    };
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  const contentLength = contentLengthHeader
    ? Number(contentLengthHeader)
    : Number.NaN;

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: errorResponse("PAYLOAD_TOO_LARGE", 413),
    };
  }

  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse("PAYLOAD_TOO_LARGE", 413),
      };
    }

    const raw = new TextDecoder().decode(bytes);
    if (!raw.trim()) {
      return {
        ok: false,
        response: errorResponse("INVALID_JSON", 400),
      };
    }

    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      response: errorResponse("INVALID_JSON", 400),
    };
  }
};
