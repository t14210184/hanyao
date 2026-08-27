import {
  GOOGLE_CLOUD_PLATFORM_SCOPE,
  GOOGLE_DATA_MANAGER_SCOPE,
  GOOGLE_OAUTH_TOKEN_URL,
  type FetchLike,
} from "./types.ts";
import {
  ProviderRequestError,
  parseSafeErrorReason,
  retryableHttpStatus,
  sanitizeHttpReason,
} from "./errors.ts";

export interface ServiceAccountMaterial {
  clientEmail: string;
  privateKeyPem: string;
  tokenUri: string;
}

export interface ServiceAccountJwtClaims {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AccessTokenResult {
  accessToken: string;
  expiresIn: number | null;
}

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const parseServiceAccountJson = (
  serialized: string
): ServiceAccountMaterial => {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("INVALID_SERVICE_ACCOUNT_JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_SERVICE_ACCOUNT_JSON");
  }
  const record = value as Record<string, unknown>;
  if (record.type !== "service_account") {
    throw new Error("INVALID_SERVICE_ACCOUNT_JSON");
  }
  const clientEmail = asNonEmptyString(record.client_email);
  const privateKeyPem = asNonEmptyString(record.private_key);
  const tokenUri = asNonEmptyString(record.token_uri) || GOOGLE_OAUTH_TOKEN_URL;
  if (!clientEmail || !privateKeyPem || tokenUri !== GOOGLE_OAUTH_TOKEN_URL) {
    throw new Error("INVALID_SERVICE_ACCOUNT_JSON");
  }
  if (
    !privateKeyPem.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKeyPem.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error("INVALID_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  return { clientEmail, privateKeyPem, tokenUri };
};

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const textToBase64Url = (text: string): string =>
  bytesToBase64Url(new TextEncoder().encode(text));

const pemToDer = (pem: string): ArrayBuffer => {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/[\r\n\t ]/g, "");
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error("INVALID_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

export const createServiceAccountAssertion = async (
  account: ServiceAccountMaterial,
  now = new Date()
): Promise<{ assertion: string; claims: ServiceAccountJwtClaims }> => {
  const iat = Math.floor(now.getTime() / 1000);
  const claims: ServiceAccountJwtClaims = {
    iss: account.clientEmail,
    scope: `${GOOGLE_DATA_MANAGER_SCOPE} ${GOOGLE_CLOUD_PLATFORM_SCOPE}`,
    aud: account.tokenUri,
    iat,
    exp: iat + 3600,
  };
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = textToBase64Url(JSON.stringify(header));
  const encodedClaims = textToBase64Url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(account.privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  return {
    assertion: `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`,
    claims,
  };
};

export const exchangeServiceAccountToken = async (
  serializedServiceAccount: string,
  fetchImpl: FetchLike = fetch,
  now = new Date()
): Promise<AccessTokenResult> => {
  let account: ServiceAccountMaterial;
  try {
    account = parseServiceAccountJson(serializedServiceAccount);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_CREDENTIAL";
    throw new ProviderRequestError("AUTH_CREDENTIAL_INVALID", false, null, code);
  }

  let assertion: string;
  try {
    ({ assertion } = await createServiceAccountAssertion(account, now));
  } catch {
    throw new ProviderRequestError("AUTH_ASSERTION_BUILD_FAILED", false);
  }

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  let response: Response;
  try {
    response = await fetchImpl(account.tokenUri, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new ProviderRequestError("AUTH_TOKEN_NETWORK_ERROR", true);
  }

  const responseText = await response.text();
  if (!response.ok) {
    throw new ProviderRequestError(
      "AUTH_TOKEN_EXCHANGE_FAILED",
      response.status === 400 || response.status === 401 || retryableHttpStatus(response.status),
      response.status,
      parseSafeErrorReason(responseText) || sanitizeHttpReason(response.status)
    );
  }

  try {
    const parsed: unknown = JSON.parse(responseText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("malformed");
    }
    const record = parsed as Record<string, unknown>;
    const accessToken = asNonEmptyString(record.access_token);
    if (!accessToken) throw new Error("missing");
    return {
      accessToken,
      expiresIn: typeof record.expires_in === "number" ? record.expires_in : null,
    };
  } catch {
    throw new ProviderRequestError("AUTH_TOKEN_RESPONSE_MALFORMED", false);
  }
};
