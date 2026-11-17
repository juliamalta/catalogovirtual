import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { assertBlobStorageConfigured, authorizeProductImageUpload, persistCompletedProductImage, ProductImageStorageError } from "@/server/services/blob-storage.service";

export const runtime = "nodejs";

function validateCallbackBaseUrl() {
  const configuredUrl = process.env.VERCEL_BLOB_CALLBACK_URL;
  if (!configuredUrl) return;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error("invalid callback URL");
    }
  } catch {
    throw new ProductImageStorageError("VERCEL_BLOB_CALLBACK_URL deve conter apenas a origem HTTPS pública do callback.", 503);
  }
}

export async function POST(request: Request) {
  try {
    assertBlobStorageConfigured();
    validateCallbackBaseUrl();
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, rawClientPayload) => {
        let clientPayload: unknown;
        try { clientPayload = rawClientPayload ? JSON.parse(rawClientPayload) : null; }
        catch { throw new ProductImageStorageError("Os dados do upload são inválidos."); }

        const { context, data } = await authorizeProductImageUpload(clientPayload, pathname);
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ ...context, ...data })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          await persistCompletedProductImage(blob, tokenPayload);
        } catch {
          // The client polls Neon and removes this unlinked object if persistence failed.
          const { del } = await import("@vercel/blob");
          await del(blob.url).catch(() => undefined);
        }
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ProductImageStorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Não foi possível autorizar o upload da imagem." }, { status: 400 });
  }
}
