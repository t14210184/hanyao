import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildHq05CanonicalConversionQuery,
  buildHq05CustomerQuery,
  classifyHq05Prerequisites,
  parseHq05CanonicalConversion,
  parseHq05Customer,
  readHq05Prerequisites,
} from "./ads-enhanced-conversion-prereq.ts";

const customerPayload = [
  {
    results: [
      {
        customer: {
          id: "4801404246",
          autoTaggingEnabled: true,
          conversionTrackingSetting: {
            acceptedCustomerDataTerms: true,
            enhancedConversionsForLeadsEnabled: true,
            conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
            googleAdsConversionCustomer: "customers/4801404246",
          },
        },
      },
    ],
  },
];

const actionPayload = [
  {
    results: [
      {
        conversionAction: {
          id: "7674301565",
          name: "HY - Verified LINE Contact",
          status: "ENABLED",
          type: "UPLOAD_CLICKS",
          category: "CONTACT",
          countingType: "MANY_PER_CLICK",
          primaryForGoal: false,
          includeInConversionsMetric: false,
          origin: "WEBSITE",
          ownerCustomer: "customers/4801404246",
        },
      },
    ],
  },
];

test("HQ05 queries are exact read-only prerequisite checks", async () => {
  const customerQuery = buildHq05CustomerQuery();
  assert.match(customerQuery, /accepted_customer_data_terms/);
  assert.match(customerQuery, /enhanced_conversions_for_leads_enabled/);
  assert.match(customerQuery, /auto_tagging_enabled/);
  assert.match(customerQuery, /google_ads_conversion_customer/);

  const actionQuery = buildHq05CanonicalConversionQuery();
  assert.match(actionQuery, /conversion_action\.id = 7674301565/);
  assert.match(actionQuery, /primary_for_goal/);
  assert.match(actionQuery, /counting_type/);

  const source = await readFile(
    "scripts/ads-enhanced-conversion-prereq.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /googleAds:mutate|conversionActions:mutate|events:ingest|UPDATE\s|INSERT\s|DELETE\s/i
  );
});

test("HQ05 parser returns exact current canonical identities", () => {
  const customer = parseHq05Customer(customerPayload[0].results);
  const action = parseHq05CanonicalConversion(actionPayload[0].results);
  assert.deepEqual(customer, {
    customerId: "4801404246",
    autoTaggingEnabled: true,
    acceptedCustomerDataTerms: true,
    enhancedConversionsForLeadsEnabled: true,
    conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
    googleAdsConversionCustomer: "customers/4801404246",
  });
  assert.deepEqual(action, {
    id: "7674301565",
    name: "HY - Verified LINE Contact",
    status: "ENABLED",
    type: "UPLOAD_CLICKS",
    category: "CONTACT",
    countingType: "MANY_PER_CLICK",
    primaryForGoal: false,
    includeInConversionsMetric: false,
    origin: "WEBSITE",
    ownerCustomer: "customers/4801404246",
  });
});

test("HQ05 READY requires terms, enhanced conversion opt-in, auto-tagging and exact owner", () => {
  const customer = parseHq05Customer(customerPayload[0].results);
  const action = parseHq05CanonicalConversion(actionPayload[0].results);
  const verdict = classifyHq05Prerequisites(customer, action);
  assert.equal(verdict.result, "READY");
  assert.equal(verdict.destinationShapeCompatible, true);
  assert.deepEqual(verdict.blockingReasons, []);

  const blocked = classifyHq05Prerequisites(
    {
      ...customer,
      acceptedCustomerDataTerms: false,
      enhancedConversionsForLeadsEnabled: false,
      autoTaggingEnabled: false,
    },
    {
      ...action,
      ownerCustomer: "customers/999",
    }
  );
  assert.equal(blocked.result, "BLOCKED");
  assert.deepEqual(blocked.blockingReasons.sort(), [
    "AUTO_TAGGING_DISABLED",
    "CUSTOMER_DATA_TERMS_NOT_ACCEPTED",
    "DATA_MANAGER_DESTINATION_OWNER_MISMATCH",
    "ENHANCED_CONVERSIONS_NOT_ENABLED",
  ]);
});

test("HQ05 live reader performs exactly two SearchStream reads and no mutation", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let count = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    const body = count++ === 0 ? customerPayload : actionPayload;
    return new Response(JSON.stringify(body), { status: 200 });
  };

  const verdict = await readHq05Prerequisites(
    "test-token",
    "9401096633",
    fetchImpl
  );
  assert.equal(verdict.result, "READY");
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.match(call.url, /googleAds:searchStream$/);
    assert.equal(call.init?.method, "POST");
    assert.equal(
      new Headers(call.init?.headers).get("login-customer-id"),
      "9401096633"
    );
    const body = JSON.parse(String(call.init?.body));
    assert.doesNotMatch(
      body.query,
      /mutate|UPDATE\s|INSERT\s|DELETE\s/i
    );
  }
});

test("HQ05 rejects identity drift and bounds provider error evidence", async () => {
  const wrongCustomer = structuredClone(customerPayload);
  wrongCustomer[0].results[0].customer.id = "999";
  assert.throws(
    () => parseHq05Customer(wrongCustomer[0].results),
    /HQ05_CUSTOMER_IDENTITY_DRIFT/
  );

  await assert.rejects(
    () =>
      readHq05Prerequisites(
        "test-token",
        null,
        async () =>
          new Response(
            JSON.stringify({
              error: {
                status: "PERMISSION_DENIED",
                message: "provider-secret-detail-must-not-leak",
              },
            }),
            { status: 403 }
          )
      ),
    (error) => {
      assert.match(
        String(error),
        /HQ05_GOOGLE_ADS_HTTP_403_PERMISSION_DENIED/
      );
      assert.doesNotMatch(String(error), /provider-secret-detail/);
      return true;
    }
  );
});
