import { describe, expect, it } from "vitest";
import { validateTestDatabaseEnvironment } from "../../scripts/lib/test-database-safety.mjs";

const safe = {
  RUN_TENANT_INTEGRATION_TESTS: "YES",
  TEST_DATABASE_URL: "postgresql://fixture:synthetic@ep-fixture.example/catalogo_tenant_test?sslmode=require",
  TEST_DATABASE_NAME: "catalogo_tenant_test",
  TEST_DATABASE_ENDPOINT: "ep-fixture.example",
  TEST_NEON_BRANCH_ID: "br-fixture-only",
  PRIMARY_NEON_BRANCH_ID: "br-primary-fixture",
  TEST_DATABASE_APPROVAL: "ISOLATED_BRANCH_WRITES_AUTHORIZED",
  DATABASE_URL: "postgresql://fixture:synthetic@ep-primary-pooler.example/neondb?sslmode=require"
};

describe("isolated PostgreSQL execution gate (synthetic URLs only)", () => {
  it("does not enable writes by default", () => expect(validateTestDatabaseEnvironment({})).toBeNull());
  it("accepts a complete isolated direct TLS configuration", () => expect(validateTestDatabaseEnvironment(safe)?.databaseName).toBe("catalogo_tenant_test"));
  for (const key of Object.keys(safe).filter((key) => key !== "DATABASE_URL" && key !== "RUN_TENANT_INTEGRATION_TESTS")) {
    it(`fails closed when explicit execution lacks ${key}`, () => expect(() => validateTestDatabaseEnvironment({ ...safe, [key]: undefined })).toThrow("no fixtures were written"));
  }
  for (const [label, change] of [
    ["main database", { TEST_DATABASE_NAME: "neondb" }],
    ["URL database mismatch", { TEST_DATABASE_NAME: "other_test" }],
    ["same branch ID", { TEST_NEON_BRANCH_ID: safe.PRIMARY_NEON_BRANCH_ID }],
    ["same endpoint with another database", { DATABASE_URL: "postgresql://x:y@ep-fixture-pooler.example/neondb?sslmode=require" }],
    ["unapproved endpoint", { TEST_DATABASE_ENDPOINT: "ep-other.example" }],
    ["pooled fixture connection", { TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace("ep-fixture.", "ep-fixture-pooler.") }],
    ["unencrypted connection", { TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace("require", "disable") }],
    ["malformed URL", { TEST_DATABASE_URL: "not-a-connection-secret" }],
    ["non PostgreSQL URL", { TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace("postgresql:", "https:") }]
  ] as const) {
    it(`rejects ${label} without leaking the connection`, () => {
      try { validateTestDatabaseEnvironment({ ...safe, ...change }); throw new Error("expected rejection"); }
      catch (error) { expect(String(error)).toContain("Credentials suppressed"); expect(String(error)).not.toContain("synthetic"); }
    });
  }
});
