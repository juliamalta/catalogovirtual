import { expect, it } from "vitest";
import { productImageUploadErrorMessage } from "./product-image-upload-error";

it("shows actionable retry instructions when the SDK hides a presigned endpoint failure", () => {
  const message = productImageUploadErrorMessage(new Error("Vercel Blob: Failed to retrieve the presigned URL"));
  expect(message).toContain("Tente salvar novamente");
  expect(message).not.toContain("presigned");
});

it("preserves the distinct message for an uploaded object awaiting database confirmation", () => {
  const message = "O arquivo chegou ao Blob, mas a confirmação no banco não respondeu.";
  expect(productImageUploadErrorMessage(new Error(message))).toBe(message);
});
