import { z } from "zod";
import { MAX_PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_MIME_TYPES } from "./image-storage.types";

export const productImageUploadPayloadSchema = z.object({
  storeSlug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  productId: z.string().uuid(),
  mimeType: z.enum(PRODUCT_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(MAX_PRODUCT_IMAGE_SIZE),
  replaceImageId: z.string().uuid().optional()
});

export const productImageIdSchema = z.string().uuid();
export const productImageCompletionPayloadSchema = productImageUploadPayloadSchema.extend({
  userId: z.string().trim().min(1).max(255),
  storeId: z.string().uuid()
});

export function matchesImageSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (mimeType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
