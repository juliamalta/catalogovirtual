import { afterEach, expect, it, vi } from "vitest";
import { getBlobUploadMode, hasBlobWriteCredentials, hasProductImageCallback } from "./blob-configuration";

afterEach(() => vi.unstubAllEnvs());
function configuration(oidc = "", store = "", key = "", token = "") {
  vi.stubEnv("VERCEL_OIDC_TOKEN", oidc); vi.stubEnv("BLOB_STORE_ID", store);
  vi.stubEnv("BLOB_WEBHOOK_PUBLIC_KEY", key); vi.stubEnv("BLOB_READ_WRITE_TOKEN", token);
}
it("does not enable uploads for an unconfigured or incomplete OIDC environment", () => {
  configuration(); expect(getBlobUploadMode()).toBeNull(); expect(hasBlobWriteCredentials()).toBe(false);
  configuration("test-oidc"); expect(getBlobUploadMode()).toBeNull(); expect(hasBlobWriteCredentials()).toBe(false);
  configuration("test-oidc", "test-store"); expect(getBlobUploadMode()).toBeNull(); expect(hasBlobWriteCredentials()).toBe(true);
});
it("enables presigned uploads without a static token when OIDC, store and callback public key exist", () => {
  configuration("test-oidc", "test-store", "test-public-key");
  expect(getBlobUploadMode()).toBe("presigned"); expect(hasBlobWriteCredentials()).toBe(true);
});
it("preserves legacy token mode and gives the complete OIDC mode precedence", () => {
  configuration("", "", "", "test-static-token"); expect(getBlobUploadMode()).toBe("legacy");
  configuration("test-oidc", "test-store", "test-public-key", "test-static-token"); expect(getBlobUploadMode()).toBe("presigned");
});

it("requires a public callback locally, including Vercel Development", () => {
  vi.stubEnv("VERCEL_BLOB_CALLBACK_URL", "");
  vi.stubEnv("VERCEL", "");
  expect(hasProductImageCallback()).toBe(false);
  vi.stubEnv("VERCEL", "1"); vi.stubEnv("VERCEL_ENV", "development");
  vi.stubEnv("VERCEL_URL", "development.invalid");
  expect(hasProductImageCallback()).toBe(false);
  vi.stubEnv("VERCEL_BLOB_CALLBACK_URL", "https://callback.invalid");
  expect(hasProductImageCallback()).toBe(true);
});

it("preserves automatic Production and Preview callbacks provided by Vercel", () => {
  vi.stubEnv("VERCEL_BLOB_CALLBACK_URL", ""); vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "store.invalid");
  expect(hasProductImageCallback()).toBe(true);
  vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("VERCEL_BRANCH_URL", ""); vi.stubEnv("VERCEL_URL", "preview.invalid");
  expect(hasProductImageCallback()).toBe(true);
  vi.stubEnv("VERCEL_URL", "");
  expect(hasProductImageCallback()).toBe(false);
});
