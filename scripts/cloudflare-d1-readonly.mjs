const API_BASE = "https://api.cloudflare.com/client/v4";
const FORBIDDEN_SQL = /\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE|ATTACH|DETACH|VACUUM|PRAGMA|REINDEX)\b/i;

export const assertReadOnlySql = (sql) => {
  if (typeof sql !== "string" || sql.trim().length === 0) {
    throw new Error("CLOUDFLARE_D1_READONLY_SQL_REQUIRED");
  }
  const normalized = sql.trim();
  if (!/^SELECT\b/i.test(normalized)) {
    throw new Error("CLOUDFLARE_D1_READONLY_SELECT_ONLY");
  }
  if (normalized.includes(";")) {
    throw new Error("CLOUDFLARE_D1_READONLY_SINGLE_STATEMENT_ONLY");
  }
  if (FORBIDDEN_SQL.test(normalized)) {
    throw new Error("CLOUDFLARE_D1_READONLY_FORBIDDEN_TOKEN");
  }
  return normalized;
};

const asNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const queryD1ReadOnly = async ({
  accountId,
  databaseId,
  token,
  sql,
  params = [],
  fetchImpl = fetch,
  apiBase = API_BASE,
}) => {
  if (!accountId || !databaseId || !token) {
    throw new Error("CLOUDFLARE_D1_READONLY_CREDENTIALS_REQUIRED");
  }
  const statement = assertReadOnlySql(sql);
  const response = await fetchImpl(
    `${apiBase}/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ sql: statement, params }),
    }
  );
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("CLOUDFLARE_D1_READONLY_RESPONSE_MALFORMED");
  }
  if (!response.ok) {
    throw new Error(`CLOUDFLARE_D1_READONLY_HTTP_${response.status}`);
  }
  if (payload?.success === false) {
    throw new Error("CLOUDFLARE_D1_READONLY_API_FAILED");
  }
  const first = Array.isArray(payload?.result) ? payload.result[0] : null;
  if (!first || first.success === false) {
    throw new Error("CLOUDFLARE_D1_READONLY_QUERY_FAILED");
  }
  const meta = first.meta ?? {};
  const rowsWritten = asNumber(meta.rows_written);
  const changes = asNumber(meta.changes);
  const changedDb = meta.changed_db === true;
  if (changedDb || rowsWritten !== 0 || changes !== 0) {
    throw new Error("CLOUDFLARE_D1_READONLY_GUARD_VIOLATION");
  }
  return {
    results: Array.isArray(first.results) ? first.results : [],
    meta: {
      changedDb,
      rowsRead: asNumber(meta.rows_read),
      rowsWritten,
      changes,
    },
  };
};
