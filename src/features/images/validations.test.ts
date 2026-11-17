import { describe, expect, it } from "vitest";
import { matchesImageSignature, productImageUploadPayloadSchema } from "./validations";

describe("product image upload validation", () => {
  const base = {
    storeSlug: "loja-exemplo",
    productId: "23ac96e8-227c-4d6d-91a5-51b94f606d74",
    mimeType: "image/jpeg",
    size: 1024
  };

  it("accepts JPG, PNG and WebP uploads within the limit", () => {
    expect(productImageUploadPayloadSchema.safeParse(base).success).toBe(true);
    expect(productImageUploadPayloadSchema.safeParse({ ...base, mimeType: "image/png" }).success).toBe(true);
    expect(productImageUploadPayloadSchema.safeParse({ ...base, mimeType: "image/webp" }).success).toBe(true);
  });

  it("rejects unsupported formats, oversized files and invalid replacements", () => {
    expect(productImageUploadPayloadSchema.safeParse({ ...base, mimeType: "image/avif" }).success).toBe(false);
    expect(productImageUploadPayloadSchema.safeParse({ ...base, size: 5 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(productImageUploadPayloadSchema.safeParse({ ...base, replaceImageId: "not-a-uuid" }).success).toBe(false);
  });

  it("checks actual JPEG, PNG and WebP signatures", () => {
    expect(matchesImageSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(matchesImageSignature("image/png", new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    expect(matchesImageSignature("image/webp", new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]))).toBe(true);
    expect(matchesImageSignature("image/png", new Uint8Array([0, 1, 2, 3]))).toBe(false);
    expect(matchesImageSignature("image/avif", new Uint8Array([0, 1, 2, 3]))).toBe(false);
  });
});
