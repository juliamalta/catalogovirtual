export const PRODUCT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;

export type ProductImageMimeType = (typeof PRODUCT_IMAGE_MIME_TYPES)[number];
export type ProductImageUploadMode = "presigned" | "legacy";
export type ProductImageRecord = { id: string; imageUrl: string; altText: string; sortOrder: number };

export type ProductImageSlot = {
  key: string;
  imageUrl: string;
  altText: string;
  imageId?: string;
  originalImageUrl?: string;
  status: "uploaded" | "pending" | "uploading" | "error";
  file?: File;
  uploadedBlobUrl?: string;
  replaceImageId?: string;
  progress?: number;
  error?: string;
};
