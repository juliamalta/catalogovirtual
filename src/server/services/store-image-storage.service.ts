import { and, eq } from "drizzle-orm";
import { del, head } from "@vercel/blob";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { storeMembers, stores } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/session";
import { hasStorePermission } from "@/features/stores/permissions";
import { MAX_PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_MIME_TYPES } from "@/features/images/image-storage.types";
import { matchesImageSignature } from "@/features/images/validations";
import { hasBlobWriteCredentials } from "./blob-configuration";
import { lockStorePermission } from "@/server/authorization";

const assetTypes = ["logo", "cover"] as const;
const extensionByMime = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const storeAppearanceUploadSchema = z.object({
  storeSlug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  assetType: z.enum(assetTypes),
  mimeType: z.enum(PRODUCT_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(MAX_PRODUCT_IMAGE_SIZE)
});

export class StoreAppearanceImageError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type StoreAppearanceContext = { storeId: string; storeSlug: string; userId: string };

export function isOwnedStoreAppearanceBlobUrl(url: string, storeId: string, assetType: (typeof assetTypes)[number]) {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const prefix = `stores/${storeId}/appearance/${assetType}/`;
    const filename = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com") && /^[0-9a-f-]{36}(?:-[a-zA-Z0-9]+)?\.(?:jpg|png|webp)$/i.test(filename);
  } catch {
    return false;
  }
}

async function authorizeStoreAppearance(storeSlug: string, suppliedUserId?: string): Promise<StoreAppearanceContext> {
  const session = suppliedUserId ? null : await getCurrentSession();
  const userId = suppliedUserId ?? session?.user.id;
  if (!userId) throw new StoreAppearanceImageError("Entre na sua conta para alterar as imagens da loja.", 401);

  const [membership] = await getDb().select({ storeId: stores.id, role: storeMembers.role })
    .from(stores)
    .innerJoin(storeMembers, and(eq(storeMembers.storeId, stores.id), eq(storeMembers.userId, userId)))
    .where(eq(stores.slug, storeSlug))
    .limit(1);
  if (!membership || !hasStorePermission({ storeId: membership.storeId, role: membership.role }, membership.storeId, "MANAGE_SETTINGS")) {
    throw new StoreAppearanceImageError("Você não tem permissão para alterar as imagens desta loja.", 403);
  }
  return { storeId: membership.storeId, storeSlug, userId };
}

export async function authorizeStoreAppearanceUpload(payload: unknown, pathname: string) {
  const parsed = storeAppearanceUploadSchema.safeParse(payload);
  if (!parsed.success) throw new StoreAppearanceImageError("Os dados do upload são inválidos.");
  const data = parsed.data;
  const context = await authorizeStoreAppearance(data.storeSlug);
  const prefix = `stores/${context.storeId}/appearance/${data.assetType}/`;
  const filename = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
  if (!isOwnedStoreAppearanceBlobUrl(`https://placeholder.public.blob.vercel-storage.com/${pathname}`, context.storeId, data.assetType)
    || !filename.toLowerCase().endsWith(`.${extensionByMime[data.mimeType]}`)) {
    throw new StoreAppearanceImageError("O caminho do arquivo não é permitido para esta loja.", 403);
  }
  return { context, data };
}

export async function validateStoreAppearanceImageUrl(url: string, storeId: string, assetType: (typeof assetTypes)[number]) {
  if (!url) return;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return; }
  if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) return;
  if (!isOwnedStoreAppearanceBlobUrl(url, storeId, assetType)) throw new StoreAppearanceImageError("A imagem selecionada não pertence a esta loja.", 403);

  assertStoreAppearanceBlobConfigured();
  const metadata = await head(url);
  if (metadata.size < 1 || metadata.size > MAX_PRODUCT_IMAGE_SIZE) throw new StoreAppearanceImageError("A imagem deve ter no máximo 5 MB.");
  if (!PRODUCT_IMAGE_MIME_TYPES.includes(metadata.contentType as (typeof PRODUCT_IMAGE_MIME_TYPES)[number])) {
    throw new StoreAppearanceImageError("Envie uma imagem JPG, PNG ou WebP válida.");
  }
  const extension = extensionByMime[metadata.contentType as keyof typeof extensionByMime];
  if (!parsed.pathname.toLowerCase().endsWith(`.${extension}`)) throw new StoreAppearanceImageError("A extensão não corresponde ao formato da imagem.");
  const response = await fetch(url, { headers: { Range: "bytes=0-11" }, cache: "no-store" });
  if (!response.ok) throw new StoreAppearanceImageError("Não foi possível validar o conteúdo da imagem.", 502);
  const signature = new Uint8Array(await response.arrayBuffer()).slice(0, 12);
  if (!matchesImageSignature(metadata.contentType, signature)) throw new StoreAppearanceImageError("O conteúdo não corresponde ao formato da imagem.");
}

export async function deleteReplacedStoreAppearanceImages(storeId: string, previous: { logoUrl: string | null; coverUrl: string | null }, next: { logoUrl: string; coverUrl: string }) {
  const oldUrls = [
    previous.logoUrl && previous.logoUrl !== next.logoUrl && isOwnedStoreAppearanceBlobUrl(previous.logoUrl, storeId, "logo") ? previous.logoUrl : null,
    previous.coverUrl && previous.coverUrl !== next.coverUrl && isOwnedStoreAppearanceBlobUrl(previous.coverUrl, storeId, "cover") ? previous.coverUrl : null
  ].filter((url): url is string => Boolean(url));
  if (!oldUrls.length) return;
  await getDb().transaction(async (tx) => {
    const [current] = await tx.select({ logoUrl: stores.logoUrl, coverUrl: stores.coverUrl }).from(stores)
      .where(eq(stores.id, storeId)).for("update").limit(1);
    const unattached = oldUrls.filter((url) => url !== current?.logoUrl && url !== current?.coverUrl);
    if (unattached.length) await del(unattached).catch(() => undefined);
  });
}

export async function cleanupUnattachedStoreAppearanceImage(storeSlug: string, url: string, assetType: (typeof assetTypes)[number]) {
  if (!assetTypes.includes(assetType)) throw new StoreAppearanceImageError("O tipo de imagem não é permitido.");
  const context = await authorizeStoreAppearance(storeSlug);
  if (!isOwnedStoreAppearanceBlobUrl(url, context.storeId, assetType)) throw new StoreAppearanceImageError("O arquivo não pertence a esta loja.", 403);
  return getDb().transaction(async (tx) => {
    await lockStorePermission(tx, context.storeId, context.userId, "MANAGE_SETTINGS");
    const [store] = await tx.select({ logoUrl: stores.logoUrl, coverUrl: stores.coverUrl }).from(stores)
      .where(eq(stores.id, context.storeId)).for("update").limit(1);
    if (!store) throw new StoreAppearanceImageError("A loja não está disponível.", 404);
    if (store.logoUrl === url || store.coverUrl === url) return false;
    assertStoreAppearanceBlobConfigured();
    await del(url);
    return true;
  });
}

export function assertStoreAppearanceBlobConfigured() {
  if (!hasBlobWriteCredentials()) throw new StoreAppearanceImageError("O Vercel Blob ainda não está configurado neste ambiente.", 503);
}

