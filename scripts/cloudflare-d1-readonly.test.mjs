import assert from "node:assert/strict";
import test from "node:test";
import { assertReadOnlySql, queryD1ReadOnly } from "./cloudflare-d1-readonly.mjs";

test("allows one SELECT statement", () => {
  assert.equal(
    assertReadOnlySql("SELECT COUNT(*) AS n FROM line_events"),
    "SELECT COUNT(*) AS n FROM line_events"
  );
});

test("rejects mutations and multi statements", () => {
  for (const sql of [
    "UPDATE line_events SET match_status='UNMATCHED'",
    "DELETE FROM line_events",
    "PRAGMA foreign_keys=OFF",
    "SELECT 1; SELECT 2",
  ]) {
    assert.throws(() => assertReadOnlySql(sql), /CLOUDFLARE_D1_READONLY_/);
  }
});

test("fails closed if provider reports a write", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        success: true,
        result: [
          {
            success: true,
            results: [],
            meta: { changed_db: true, rows_written: 1, changes: 1 },
          },
        ],
      }),
  });
  await assert.rejects(
    queryD1ReadOnly({
      accountId: "acct",
      databaseId: "db",
      token: "opaque",
      sql: "SELECT 1",
      fetchImpl,
    }),
    /CLOUDFLARE_D1_READONLY_GUARD_VIOLATION/
  );
});

test("returns bounded rows and zero-write metadata", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        success: true,
        result: [
          {
            success: true,
            results: [{ n: 2 }],
            meta: {
              changed_db: false,
              rows_read: 2,
              rows_written: 0,
              changes: 0,
            },
          },
        ],
      }),
  });
  const result = await queryD1ReadOnly({
    accountId: "acct",
    databaseId: "db",
    token: "opaque",
    sql: "SELECT 1 AS n",
    fetchImpl,
  });
  assert.deepEqual(result.results, [{ n: 2 }]);
  assert.equal(result.meta.rowsWritten, 0);
  assert.equal(result.meta.changedDb, false);
});
