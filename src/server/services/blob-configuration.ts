import type { ProductImageUploadMode } from "@/features/images/image-storage.types";

export function hasBlobWriteCredentials() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
}

export function getBlobUploadMode(): ProductImageUploadMode | null {
  if (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_WEBHOOK_PUBLIC_KEY) return "presigned";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "legacy";
  return null;
}

// Matches the origins the Blob SDK can use for upload-completion callbacks.
// Appearance uploads do not need this callback; product images do.
export function hasProductImageCallback() {
  if (process.env.VERCEL_BLOB_CALLBACK_URL) return true;
  if (process.env.VERCEL !== "1") return false;
  if (process.env.VERCEL_ENV === "preview") return Boolean(process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL);
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
}
