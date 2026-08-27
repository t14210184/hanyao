export const sanitizeProviderReason = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_.:-]/g, "_")
    .slice(0, 120);
  return normalized || null;
};

export const sanitizeHttpReason = (status: number): string =>
  Number.isInteger(status) && status >= 100 && status <= 599
    ? `HTTP_${status}`
    : "HTTP_STATUS_INVALID";

export class ProviderRequestError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly httpStatus: number | null;
  readonly providerReason: string | null;

  constructor(
    code: string,
    retryable: boolean,
    httpStatus: number | null = null,
    providerReason: string | null = null
  ) {
    super(code);
    this.name = "ProviderRequestError";
    this.code = code;
    this.retryable = retryable;
    this.httpStatus = httpStatus;
    this.providerReason = sanitizeProviderReason(providerReason);
  }
}

export const retryableHttpStatus = (status: number): boolean =>
  status === 401 || status === 408 || status === 425 || status === 429 || status >= 500;

export const parseSafeErrorReason = (body: string): string | null => {
  try {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const root = value as Record<string, unknown>;
    const error =
      root.error && typeof root.error === "object" && !Array.isArray(root.error)
        ? (root.error as Record<string, unknown>)
        : root;
    const directReason =
      error.status ?? error.reason ?? error.code ?? root.reason ?? root.code;
    return sanitizeProviderReason(directReason);
  } catch {
    return null;
  }
};
