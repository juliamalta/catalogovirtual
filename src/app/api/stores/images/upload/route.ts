import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorizeStoreAppearanceUpload, assertStoreAppearanceBlobConfigured, StoreAppearanceImageError } from "@/server/services/store-image-storage.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertStoreAppearanceBlobConfigured();
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, rawClientPayload) => {
        let payload: unknown;
        try { payload = rawClientPayload ? JSON.parse(rawClientPayload) : null; }
        catch { throw new StoreAppearanceImageError("Os dados do upload são inválidos."); }
        await authorizeStoreAppearanceUpload(payload, pathname);
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000
        };
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof StoreAppearanceImageError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Não foi possível autorizar o envio da imagem." }, { status: 400 });
  }
}
