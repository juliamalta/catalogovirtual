import { handleUpload, handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { NextResponse } from "next/server";
import { authorizeStoreAppearanceUpload, assertStoreAppearanceBlobConfigured, StoreAppearanceImageError } from "@/server/services/store-image-storage.service";
import { getBlobUploadMode } from "@/server/services/blob-configuration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertStoreAppearanceBlobConfigured();
    const mode = new URL(request.url).searchParams.get("mode") ?? "legacy";
    if (mode !== getBlobUploadMode()) throw new StoreAppearanceImageError("A configuração do Blob não corresponde ao modo de upload deste painel.", 503);
    const body = await request.json();
    const authorize = async (pathname: string, rawClientPayload: string | null | undefined) => {
      let payload: unknown;
      try { payload = rawClientPayload ? JSON.parse(rawClientPayload) : null; }
      catch { throw new StoreAppearanceImageError("Os dados do upload são inválidos."); }
      await authorizeStoreAppearanceUpload(payload, pathname);
    };
    const response = mode === "presigned" ? await handleUploadPresigned({
      body: body as HandleUploadPresignedBody,
      request,
      getSignedToken: async (pathname, rawClientPayload) => {
        await authorize(pathname, rawClientPayload);
        const validUntil = Date.now() + 10 * 60 * 1000;
        const token = await issueSignedToken({ pathname, operations: ["put"], allowedContentTypes: ["image/jpeg", "image/png", "image/webp"], maximumSizeInBytes: 5 * 1024 * 1024, validUntil });
        return { token, urlOptions: { allowedContentTypes: ["image/jpeg", "image/png", "image/webp"], maximumSizeInBytes: 5 * 1024 * 1024, validUntil, addRandomSuffix: true, allowOverwrite: false } };
      }
      // Appearance URLs are validated and persisted by the authenticated save action.
    }) : await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, rawClientPayload) => {
        await authorize(pathname, rawClientPayload);
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
