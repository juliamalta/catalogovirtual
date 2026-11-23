import { generateKeyPairSync, sign } from "node:crypto";
import { expect, it, vi } from "vitest";
import { handleUploadPresigned } from "@vercel/blob/client";

it("verifies a real Ed25519 callback before invoking completion and rejects altered or missing signatures", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const webhookPublicKey = publicKey.export({ type: "spki", format: "pem" }).toString();
  const body = { type: "blob.upload-completed" as const, payload: {
    blob: { url: "https://fixture.public.blob.vercel-storage.com/test.png", pathname: "test.png", downloadUrl: "https://fixture.public.blob.vercel-storage.com/test.png?download=1", contentType: "image/png", contentDisposition: 'inline; filename="test.png"', etag: '"fixture"' },
    tokenPayload: "fixture-only",
  } };
  const signature = sign(null, Buffer.from(JSON.stringify(body)), privateKey).toString("hex");
  const completion = vi.fn();
  const getSignedToken = vi.fn();
  const request = (value?: string) => new Request("https://fixture.invalid/api/products/images/upload?mode=presigned", { method: "POST", headers: value ? { "x-vercel-signature": value } : {} });
  await handleUploadPresigned({ body, request: request(signature), webhookPublicKey, getSignedToken, onUploadCompleted: completion });
  expect(completion).toHaveBeenCalledTimes(1);
  expect(getSignedToken).not.toHaveBeenCalled();
  await expect(handleUploadPresigned({ body, request: request(), webhookPublicKey, getSignedToken, onUploadCompleted: completion })).rejects.toThrow();
  await expect(handleUploadPresigned({ body: { ...body, payload: { ...body.payload, tokenPayload: "altered" } }, request: request(signature), webhookPublicKey, getSignedToken, onUploadCompleted: completion })).rejects.toThrow();
  expect(completion).toHaveBeenCalledTimes(1);
});
