import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ authorize: vi.fn(), persist: vi.fn(), issue: vi.fn(), del: vi.fn() }));
vi.mock("@vercel/blob", async (original) => ({ ...await original<typeof import("@vercel/blob")>(), issueSignedToken: mocked.issue, del: mocked.del }));
vi.mock("@/server/services/blob-storage.service", async (original) => ({ ...await original<typeof import("@/server/services/blob-storage.service")>(), authorizeProductImageUpload: mocked.authorize, persistCompletedProductImage: mocked.persist }));
import { POST } from "./route";
import { ProductImageStorageError } from "@/server/services/blob-storage.service";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const body = { type: "blob.upload-completed", payload: {
  blob: { url: "https://fixture.public.blob.vercel-storage.com/image.png", pathname: "image.png", downloadUrl: "https://fixture.public.blob.vercel-storage.com/image.png?download=1", contentType: "image/png", contentDisposition: "inline", etag: '"fixture"' }, tokenPayload: "fixture-only"
} };
function request(value: unknown, validSignature = true) {
  const json = JSON.stringify(value);
  return new Request("http://localhost:3002/api/products/images/upload?mode=presigned", { method: "POST", headers: { "content-type": "application/json", "x-vercel-signature": validSignature ? sign(null, Buffer.from(json), privateKey).toString("hex") : "invalid" }, body: json });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VERCEL_BLOB_CALLBACK_URL", ""); vi.stubEnv("VERCEL", "");
  vi.stubEnv("BLOB_STORE_ID", "test-store"); vi.stubEnv("VERCEL_OIDC_TOKEN", "test-oidc");
  vi.stubEnv("BLOB_WEBHOOK_PUBLIC_KEY", publicKey.export({ type: "spki", format: "pem" }).toString());
  vi.spyOn(console, "info").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {});
  mocked.authorize.mockResolvedValue({ context: {}, data: {} });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("product upload callback integrity", () => {
  it("blocks new uploads with no completion callback before issuing a storage token", async () => {
    const response = await POST(request({ type: "blob.generate-presigned-url", payload: { pathname: "image.png", multipart: false, clientPayload: "{}" } }));
    expect(response.status).toBe(503);
    expect(mocked.authorize).toHaveBeenCalledOnce();
    expect(mocked.issue).not.toHaveBeenCalled();
  });
  it("preserves authentication failure even when local callback configuration is missing", async () => {
    mocked.authorize.mockRejectedValue(new ProductImageStorageError("Unauthorized", 401));
    expect((await POST(request({ type: "blob.generate-presigned-url", payload: { pathname: "image.png", clientPayload: "{}" } }))).status).toBe(401);
    expect(mocked.issue).not.toHaveBeenCalled();
  });
  it("acknowledges a signed callback only after its image has persisted", async () => {
    expect((await POST(request(body))).status).toBe(200);
    expect(mocked.persist).toHaveBeenCalledOnce();
    expect(mocked.del).not.toHaveBeenCalled();
  });
  it("returns a retryable failure and preserves the object when Neon persistence fails", async () => {
    mocked.persist.mockRejectedValue(new Error("simulated unavailable database"));
    expect((await POST(request(body))).status).toBe(503);
    expect(mocked.del).not.toHaveBeenCalled();
  });
  it("preserves tenant authorization errors without deleting unknown objects", async () => {
    mocked.persist.mockRejectedValue(new ProductImageStorageError("Forbidden", 403));
    expect((await POST(request(body))).status).toBe(403);
    expect(mocked.del).not.toHaveBeenCalled();
  });
  it("rejects an invalid signature before touching the database or storage", async () => {
    expect((await POST(request(body, false))).status).toBe(400);
    expect(mocked.persist).not.toHaveBeenCalled();
    expect(mocked.del).not.toHaveBeenCalled();
  });
});
