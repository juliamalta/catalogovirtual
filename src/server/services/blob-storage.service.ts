import { and, asc, eq } from "drizzle-orm";
import { del, head, type PutBlobResult } from "@vercel/blob";
import { getDb } from "@/lib/db";
import { productImages, products, storeMembers, stores } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/session";
import { hasStorePermission } from "@/features/stores/permissions";
import { MAX_PRODUCT_IMAGE_SIZE, MAX_PRODUCT_IMAGES } from "@/features/images/image-storage.types";
import { getBlobUploadMode, hasBlobWriteCredentials } from "./blob-configuration";
import { matchesImageSignature, productImageCompletionPayloadSchema, productImageIdSchema, productImageUploadPayloadSchema } from "@/features/images/validations";
import { lockStorePermission } from "@/server/authorization";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const extensionByMime = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export class ProductImageStorageError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type ProductContext = { userId: string; storeId: string; storeSlug: string; productId: string; productName: string };
type CompletionPayload = { userId: string; storeId: string; storeSlug: string; productId: string; mimeType: (typeof allowedMimeTypes)[number]; size: number; replaceImageId?: string };
type StoreTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function lockProductForMutation(tx: StoreTransaction, context: ProductContext) {
  await lockStorePermission(tx, context.storeId, context.userId, "MANAGE_PRODUCTS");
  const [product] = await tx.select({ id: products.id }).from(products)
    .where(and(eq(products.id, context.productId), eq(products.storeId, context.storeId))).for("update");
  if (!product) throw new ProductImageStorageError("O produto não pertence a esta loja.", 404);
}

export function isBlobStorageConfigured() {
  return getBlobUploadMode() !== null;
}

export const getProductImageUploadMode = getBlobUploadMode;

export function assertBlobStorageConfigured() {
  if (!hasBlobWriteCredentials()) {
    throw new ProductImageStorageError("O Vercel Blob ainda não está configurado neste ambiente.", 503);
  }
}

async function authorizeProduct(storeSlug: string, productId: string, suppliedUserId?: string): Promise<ProductContext> {
  const session = suppliedUserId ? null : await getCurrentSession();
  const userId = suppliedUserId ?? session?.user.id;
  if (!userId) throw new ProductImageStorageError("Entre na sua conta para enviar imagens.", 401);

  const db = getDb();
  const [membership] = await db.select({ storeId: stores.id, role: storeMembers.role })
    .from(stores)
    .innerJoin(storeMembers, and(eq(storeMembers.storeId, stores.id), eq(storeMembers.userId, userId)))
    .where(eq(stores.slug, storeSlug))
    .limit(1);
  if (!membership || !hasStorePermission({ storeId: membership.storeId, role: membership.role }, membership.storeId, "MANAGE_PRODUCTS")) {
    throw new ProductImageStorageError("Você não tem permissão para alterar produtos desta loja.", 403);
  }

  const [product] = await db.select({ id: products.id, name: products.name, storeId: products.storeId })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, membership.storeId)))
    .limit(1);
  if (!product) throw new ProductImageStorageError("O produto não pertence a esta loja.", 404);

  return { userId, storeId: product.storeId, storeSlug, productId: product.id, productName: product.name };
}

function ownedProductBlobPath(pathname: string, storeId: string, productId: string) {
  const prefix = `stores/${storeId}/products/${productId}/`;
  if (!pathname.startsWith(prefix)) return false;
  const filename = pathname.slice(prefix.length);
  return /^[0-9a-f-]{36}(?:-[a-zA-Z0-9]+)?\.(?:jpg|png|webp)$/i.test(filename);
}

export function isOwnedProductBlobUrl(url: string, storeId: string, productId: string) {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com") && ownedProductBlobPath(pathname, storeId, productId);
  } catch {
    return false;
  }
}

function extensionMatchesMime(pathname: string, mimeType: string) {
  const extension = extensionByMime[mimeType as keyof typeof extensionByMime];
  return pathname.toLowerCase().endsWith(`.${extension}`);
}

async function assertBlobContents(blob: PutBlobResult, context: ProductContext, expectedMimeType: string, expectedSize: number) {
  if (!isOwnedProductBlobUrl(blob.url, context.storeId, context.productId) || !ownedProductBlobPath(blob.pathname, context.storeId, context.productId)) {
    throw new ProductImageStorageError("O caminho do arquivo não é permitido para este produto.", 403);
  }

  const metadata = await head(blob.url);
  if (metadata.size < 1 || metadata.size > MAX_PRODUCT_IMAGE_SIZE || metadata.size !== expectedSize) {
    throw new ProductImageStorageError("O arquivo excede o limite de 5 MB ou tem tamanho inválido.");
  }
  if (!allowedMimeTypes.includes(metadata.contentType as (typeof allowedMimeTypes)[number]) || metadata.contentType !== expectedMimeType || !extensionMatchesMime(blob.pathname, metadata.contentType)) {
    throw new ProductImageStorageError("Envie uma imagem JPG, PNG ou WebP válida.");
  }

  const response = await fetch(blob.url, { headers: { Range: "bytes=0-11" }, cache: "no-store" });
  if (!response.ok) throw new ProductImageStorageError("Não foi possível validar o conteúdo da imagem.", 502);
  const signature = new Uint8Array(await response.arrayBuffer()).slice(0, 12);
  if (!matchesImageSignature(metadata.contentType, signature)) {
    throw new ProductImageStorageError("O conteúdo do arquivo não corresponde ao formato da imagem.");
  }
}

export async function authorizeProductImageUpload(payload: unknown, pathname: string) {
  const parsed = productImageUploadPayloadSchema.safeParse(payload);
  if (!parsed.success) throw new ProductImageStorageError("Os dados do upload são inválidos.");
  const data = parsed.data;
  const context = await authorizeProduct(data.storeSlug, data.productId);
  const extension = extensionByMime[data.mimeType];
  const expectedPrefix = `stores/${context.storeId}/products/${context.productId}/`;
  const filename = pathname.startsWith(expectedPrefix) ? pathname.slice(expectedPrefix.length) : "";
  if (!ownedProductBlobPath(pathname, context.storeId, context.productId) || !filename.toLowerCase().endsWith(`.${extension}`)) {
    throw new ProductImageStorageError("O caminho do arquivo não é permitido para este produto.", 403);
  }

  const existing = await getDb().select({ id: productImages.id, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(eq(productImages.productId, context.productId));
  if (data.replaceImageId) {
    const replacement = existing.find((image) => image.id === data.replaceImageId);
    if (!replacement) throw new ProductImageStorageError("A imagem que você quer substituir não pertence a este produto.", 404);
  } else if (existing.length >= MAX_PRODUCT_IMAGES) {
    throw new ProductImageStorageError("Cada produto pode ter até cinco imagens.");
  }

  return { context, data };
}

export async function persistCompletedProductImage(blob: PutBlobResult, rawPayload: string | null | undefined) {
  if (!rawPayload || rawPayload.length > 1500) throw new ProductImageStorageError("A autorização do upload é inválida.", 403);
  let value: unknown;
  try { value = JSON.parse(rawPayload); } catch { throw new ProductImageStorageError("A autorização do upload é inválida.", 403); }
  const parsed = productImageCompletionPayloadSchema.safeParse(value);
  if (!parsed.success) throw new ProductImageStorageError("A autorização do upload é inválida.", 403);
  const data: CompletionPayload = parsed.data;
  const context = await authorizeProduct(data.storeSlug, data.productId, data.userId);
  if (context.storeId !== data.storeId) throw new ProductImageStorageError("A loja do upload não corresponde ao produto.", 403);
  const db = getDb();
  const previousUrl = await db.transaction(async (tx) => {
    await lockProductForMutation(tx, context);
    await assertBlobContents(blob, context, data.mimeType, data.size);
    const images = await tx.select().from(productImages)
      .where(eq(productImages.productId, context.productId))
      .orderBy(asc(productImages.sortOrder));

    if (data.replaceImageId) {
      const previous = images.find((image) => image.id === data.replaceImageId);
      if (!previous) throw new ProductImageStorageError("A imagem que você quer substituir não pertence a este produto.", 404);
      if (previous.imageUrl === blob.url) return undefined;
      await tx.update(productImages).set({ imageUrl: blob.url, altText: context.productName })
        .where(and(eq(productImages.id, previous.id), eq(productImages.productId, context.productId)));
      return previous.imageUrl;
    }

    if (images.some((image) => image.imageUrl === blob.url)) return undefined;
    if (images.length >= MAX_PRODUCT_IMAGES) throw new ProductImageStorageError("Cada produto pode ter até cinco imagens.");
    await tx.insert(productImages).values({
      productId: context.productId,
      imageUrl: blob.url,
      altText: context.productName,
      sortOrder: images.length
    });
    return undefined;
  });

  if (previousUrl && isOwnedProductBlobUrl(previousUrl, context.storeId, context.productId)) {
    await del(previousUrl).catch(() => undefined);
  }
}

export async function getProductImagesForUser(storeSlug: string, productId: string) {
  const context = await authorizeProduct(storeSlug, productId);
  return getDb().select({ id: productImages.id, imageUrl: productImages.imageUrl, altText: productImages.altText, sortOrder: productImages.sortOrder })
    .from(productImages)
    .where(eq(productImages.productId, context.productId))
    .orderBy(asc(productImages.sortOrder));
}

export async function removeProductImageForUser(storeSlug: string, productId: string, imageId: string) {
  const context = await authorizeProduct(storeSlug, productId);
  const parsedId = productImageIdSchema.safeParse(imageId);
  if (!parsedId.success) throw new ProductImageStorageError("A imagem selecionada é inválida.");
  const db = getDb();
  const image = await db.transaction(async (tx) => {
    await lockProductForMutation(tx, context);
    const [image] = await tx.select().from(productImages)
      .where(and(eq(productImages.id, parsedId.data), eq(productImages.productId, context.productId))).limit(1);
    if (!image) throw new ProductImageStorageError("A imagem não pertence a este produto.", 404);
    if (isOwnedProductBlobUrl(image.imageUrl, context.storeId, context.productId)) assertBlobStorageConfigured();
    await tx.delete(productImages).where(and(eq(productImages.id, image.id), eq(productImages.productId, context.productId)));
    const remaining = await tx.select({ id: productImages.id }).from(productImages)
      .where(eq(productImages.productId, context.productId)).orderBy(asc(productImages.sortOrder));
    await Promise.all(remaining.map((item, index) => tx.update(productImages).set({ sortOrder: index })
      .where(and(eq(productImages.id, item.id), eq(productImages.productId, context.productId)))));
    return image;
  });
  if (isOwnedProductBlobUrl(image.imageUrl, context.storeId, context.productId)) {
    await del(image.imageUrl).catch(() => undefined);
  }
}

export async function makeProductImagePrimaryForUser(storeSlug: string, productId: string, imageId: string) {
  const context = await authorizeProduct(storeSlug, productId);
  const db = getDb();
  await db.transaction(async (tx) => {
    await lockProductForMutation(tx, context);
    const images = await tx.select().from(productImages).where(eq(productImages.productId, context.productId)).orderBy(asc(productImages.sortOrder));
    if (!images.some((image) => image.id === imageId)) throw new ProductImageStorageError("A imagem não pertence a este produto.", 404);
    const reordered = [images.find((image) => image.id === imageId)!, ...images.filter((image) => image.id !== imageId)];
    await Promise.all(reordered.map((image, index) => tx.update(productImages).set({ sortOrder: index })
      .where(and(eq(productImages.id, image.id), eq(productImages.productId, context.productId)))));
  });
}

export async function reorderProductImagesForUser(storeSlug: string, productId: string, imageIds: string[]) {
  const context = await authorizeProduct(storeSlug, productId);
  if (imageIds.length > MAX_PRODUCT_IMAGES || new Set(imageIds).size !== imageIds.length || imageIds.some((id) => !productImageIdSchema.safeParse(id).success)) {
    throw new ProductImageStorageError("A ordem das imagens é inválida.");
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await lockProductForMutation(tx, context);
    const images = await tx.select({ id: productImages.id }).from(productImages).where(eq(productImages.productId, context.productId));
    if (images.length !== imageIds.length || images.some((image) => !imageIds.includes(image.id))) {
      throw new ProductImageStorageError("A lista de imagens mudou. Atualize a página e tente novamente.", 409);
    }
    await Promise.all(imageIds.map((id, index) => tx.update(productImages).set({ sortOrder: index })
      .where(and(eq(productImages.id, id), eq(productImages.productId, context.productId)))));
  });
}

export async function cleanupUnattachedProductBlob(storeSlug: string, productId: string, url: string) {
  const context = await authorizeProduct(storeSlug, productId);
  if (!isOwnedProductBlobUrl(url, context.storeId, context.productId)) throw new ProductImageStorageError("O arquivo não pertence a este produto.", 403);
  return getDb().transaction(async (tx) => {
    await lockProductForMutation(tx, context);
    const [attached] = await tx.select({ id: productImages.id }).from(productImages)
      .where(and(eq(productImages.productId, context.productId), eq(productImages.imageUrl, url))).limit(1);
    if (attached) return false;
    assertBlobStorageConfigured();
    await del(url);
    return true;
  });
}

export async function deleteProductBlobsAfterProductRemoval(storeId: string, productId: string, imageUrls: string[]) {
  const urls = imageUrls.filter((url) => isOwnedProductBlobUrl(url, storeId, productId));
  if (!urls.length || !hasBlobWriteCredentials()) return;
  await del(urls).catch(() => undefined);
}
