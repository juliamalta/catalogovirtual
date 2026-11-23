import { issueSignedToken, type PutBlobResult } from "@vercel/blob";
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { assertBlobStorageConfigured, authorizeProductImageUpload, getProductImageUploadMode, persistCompletedProductImage, ProductImageStorageError } from "@/server/services/blob-storage.service";
import { hasProductImageCallback } from "@/server/services/blob-configuration";

export const runtime = "nodejs";

const allowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
const maximumSizeInBytes = 5 * 1024 * 1024;

type UploadedBlob = { blob: PutBlobResult; tokenPayload?: string | null };

function parseClientPayload(rawClientPayload: string | null) {
  try { return rawClientPayload ? JSON.parse(rawClientPayload) as unknown : null; }
  catch { throw new ProductImageStorageError("Os dados do upload são inválidos."); }
}

async function completeUpload({ blob, tokenPayload }: UploadedBlob) {
  // The SDK invokes this only after verifying the callback signature.
  console.info("[product-image-callback] signature verified");
  try {
    await persistCompletedProductImage(blob, tokenPayload);
    console.info("[product-image-callback] persisted", { pathname: blob.pathname });
  } catch (error) {
    // Never acknowledge a failed write or delete an object whose attachment state
    // may be unknown. The authenticated client can reconcile its own upload.
    console.error("[product-image-callback] persistence failed", { status: error instanceof ProductImageStorageError ? error.status : 503 });
    if (error instanceof ProductImageStorageError) throw error;
    throw new ProductImageStorageError("Não foi possível confirmar a imagem no banco. O callback deve ser reenviado.", 503);
  }
}

function assertProductImageCallbackConfigured() {
  if (!hasProductImageCallback()) {
    throw new ProductImageStorageError("Configure VERCEL_BLOB_CALLBACK_URL com a origem HTTPS pública do callback antes de enviar imagens de produtos neste ambiente.", 503);
  }
}

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
    validateCallbackBaseUrl();
    const url = new URL(request.url);
    const requestedMode = url.searchParams.get("mode");
    if (requestedMode && requestedMode !== "presigned" && requestedMode !== "legacy") {
      throw new ProductImageStorageError("Modo de upload inválido.");
    }

    const uploadMode = getProductImageUploadMode();
    if (!uploadMode) assertBlobStorageConfigured();
    const mode = requestedMode ?? "legacy";
    if (uploadMode !== mode) {
      throw new ProductImageStorageError("A configuração do Blob não corresponde ao modo de upload deste painel.", 503);
    }

    const body = await request.json();
    const response = mode === "presigned"
      ? await handleUploadPresigned({
        body: body as HandleUploadPresignedBody,
        request,
        getSignedToken: async (pathname, rawClientPayload) => {
          const { context, data } = await authorizeProductImageUpload(parseClientPayload(rawClientPayload), pathname);
          assertProductImageCallbackConfigured();
          const validUntil = Date.now() + 10 * 60 * 1000;
          const token = await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes,
            maximumSizeInBytes,
            validUntil
          });
          return {
            token,
            urlOptions: {
              allowedContentTypes,
              maximumSizeInBytes,
              validUntil,
              addRandomSuffix: true,
              allowOverwrite: false,
              tokenPayload: JSON.stringify({ ...context, ...data })
            }
          };
        },
        onUploadCompleted: completeUpload
      })
      : await handleUpload({
        body: body as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname, rawClientPayload) => {
          const { context, data } = await authorizeProductImageUpload(parseClientPayload(rawClientPayload), pathname);
          assertProductImageCallbackConfigured();
          return {
            allowedContentTypes,
            maximumSizeInBytes,
            addRandomSuffix: true,
            allowOverwrite: false,
            validUntil: Date.now() + 10 * 60 * 1000,
            tokenPayload: JSON.stringify({ ...context, ...data })
          };
        },
        onUploadCompleted: completeUpload
      });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ProductImageStorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Não foi possível autorizar o upload da imagem." }, { status: 400 });
  }
}
