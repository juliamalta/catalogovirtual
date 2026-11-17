import { and, asc, count, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, productImages, products, productVariants, storeMembers, storeSettings, stores } from "@/lib/db/schema";
import type { StorePublicDTO } from "@/types/store.types";

export async function getStoresForUser(userId: string) {
  return getDb().select({ id: stores.id, name: stores.name, slug: stores.slug, status: stores.status, storefrontType: stores.storefrontType, role: storeMembers.role })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, userId))
    .orderBy(asc(stores.createdAt));
}

export async function getStoreCounts(storeId: string) {
  const db = getDb();
  const [productCount] = await db.select({ value: count() }).from(products).where(eq(products.storeId, storeId));
  const [categoryCount] = await db.select({ value: count() }).from(categories).where(eq(categories.storeId, storeId));
  return { products: productCount?.value ?? 0, categories: categoryCount?.value ?? 0 };
}

export async function getStoreCategories(storeId: string) {
  return getDb().select().from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getStoreProducts(storeId: string) {
  const db = getDb();
  const rows = await db.select({ product: products, categoryName: categories.name })
    .from(products)
    .leftJoin(categories, and(eq(categories.id, products.categoryId), eq(categories.storeId, storeId)))
    .where(eq(products.storeId, storeId))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  if (!rows.length) return [];
  const productIds = rows.map(({ product }) => product.id);
  const images = await db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder));
  const variants = await db.select().from(productVariants).where(inArray(productVariants.productId, productIds)).orderBy(asc(productVariants.sortOrder));
  const productImageList = new Map<string, typeof images>();
  for (const image of images) productImageList.set(image.productId, [...(productImageList.get(image.productId) ?? []), image]);
  const options = new Map<string, string[]>();
  for (const variant of variants) options.set(variant.productId, [...(options.get(variant.productId) ?? []), variant.value]);
  return rows.map(({ product, categoryName }) => {
    const images = productImageList.get(product.id) ?? [];
    return { ...product, categoryName, imageUrl: images[0]?.imageUrl ?? "", images, options: options.get(product.id) ?? [] };
  });
}

export async function getPublicStoreBySlug(slug: string, includeDraft = false): Promise<StorePublicDTO | null> {
  const db = getDb();
  const [result] = await db.select({
    id: stores.id,
    slug: stores.slug,
    name: stores.name,
    description: stores.description,
    storefrontType: stores.storefrontType,
    whatsappNumber: stores.whatsappNumber,
    logoUrl: stores.logoUrl,
    coverUrl: stores.coverUrl,
    settings: storeSettings
  })
    .from(stores)
    .leftJoin(storeSettings, eq(storeSettings.storeId, stores.id))
    .where(includeDraft ? eq(stores.slug, slug) : and(eq(stores.slug, slug), eq(stores.status, "PUBLISHED")))
    .limit(1);
  if (!result) return null;

  const activeCategories = await db.select().from(categories)
    .where(and(eq(categories.storeId, result.id), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const activeProducts = await db.select().from(products)
    .where(and(eq(products.storeId, result.id), eq(products.isActive, true)))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  const productIds = activeProducts.map((product) => product.id);
  const [images, variants] = productIds.length ? await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder)),
    db.select().from(productVariants).where(and(inArray(productVariants.productId, productIds), eq(productVariants.isActive, true))).orderBy(asc(productVariants.sortOrder))
  ]) : [[], []];
  const productImageList = new Map<string, string[]>();
  for (const image of images) productImageList.set(image.productId, [...(productImageList.get(image.productId) ?? []), image.imageUrl]);
  const options = new Map<string, string[]>();
  for (const variant of variants) options.set(variant.productId, [...(options.get(variant.productId) ?? []), variant.value]);
  const categoryNames = new Map(activeCategories.map((category) => [category.id, category.name]));

  return {
    id: result.id,
    slug: result.slug,
    name: result.name,
    description: result.description,
    tagline: result.settings?.headline || result.name,
    subtitle: result.settings?.subtitle || "",
    type: result.storefrontType,
    whatsappNumber: result.whatsappNumber,
    accent: result.settings?.primaryColor || "#7351D6",
    background: result.settings?.secondaryColor || "#F5F2FF",
    logoUrl: result.logoUrl,
    coverUrl: result.coverUrl,
    categories: activeCategories.map(({ id, name }) => ({ id, name })),
    products: activeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      image: productImageList.get(product.id)?.[0] ?? "",
      images: productImageList.get(product.id) ?? [],
      category: product.categoryId ? categoryNames.get(product.categoryId) ?? "" : "",
      ...(product.isFeatured ? { badge: "Destaque" } : {}),
      options: options.get(product.id) ?? []
    }))
  };
}
