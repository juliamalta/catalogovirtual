import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, productImages, productVariants, products, storeMembers, storeSettings, stores } from "@/lib/db/schema";
import { categoryInputSchema, createStoreSchema, productInputSchema, storeSettingsSchema, storeSlugSchema, updateStoreSchema, slugify } from "@/lib/validations/store";
import { requireAuthorizedStore, requireUser } from "@/server/authorization";
import { deleteProductBlobsAfterProductRemoval } from "@/server/services/blob-storage.service";
import { deleteReplacedStoreAppearanceImages, validateStoreAppearanceImageUrl } from "@/server/services/store-image-storage.service";

export class StoreInputError extends Error {}

export async function isStoreSlugAvailableForUser(value: string) {
  await requireUser();
  const parsed = storeSlugSchema.safeParse(value);
  if (!parsed.success) return false;
  const [existing] = await getDb().select({ id: stores.id }).from(stores)
    .where(eq(stores.slug, parsed.data))
    .limit(1);
  return !existing;
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function formBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function formSortOrder(formData: FormData, name = "sortOrder") {
  const value = formValue(formData, name);
  return value ? Number(value) : 0;
}

async function uniqueSlug(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], storeId: string, value: string, excludedId?: string) {
  const root = slugify(value) || "item";
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const [existing] = await tx.select({ id: products.id }).from(products)
      .where(and(eq(products.storeId, storeId), eq(products.slug, candidate)))
      .limit(1);
    if (!existing || existing.id === excludedId) return candidate;
  }
  throw new StoreInputError("Não foi possível gerar um endereço único para este item.");
}

async function uniqueCategorySlug(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], storeId: string, value: string, excludedId?: string) {
  const root = slugify(value) || "categoria";
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const [existing] = await tx.select({ id: categories.id }).from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.slug, candidate)))
      .limit(1);
    if (!existing || existing.id === excludedId) return candidate;
  }
  throw new StoreInputError("Não foi possível gerar um endereço único para esta categoria.");
}

export async function createStoreForUser(input: unknown) {
  const user = await requireUser();
  const data = createStoreSchema.safeParse(input);
  if (!data.success) throw new StoreInputError(data.error.issues[0]?.message ?? "Confira os dados da loja.");
  const db = getDb();
  const [created] = await db.transaction(async (tx) => {
    const [store] = await tx.insert(stores).values({
      name: data.data.name,
      slug: data.data.slug,
      description: data.data.description,
      whatsappNumber: data.data.whatsappNumber,
      storefrontType: data.data.storefrontType
    }).returning();
    await tx.insert(storeMembers).values({ storeId: store.id, userId: user.id, role: "OWNER" });
    await tx.insert(storeSettings).values({ storeId: store.id, primaryColor: data.data.primaryColor, headline: data.data.name });
    return [store] as const;
  });
  return created;
}

export async function createProductForStore(storeSlug: string, formData: FormData) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const parsed = productInputSchema.safeParse({
    name: formValue(formData, "name"), description: formValue(formData, "description"), price: formValue(formData, "price"),
    categoryId: formValue(formData, "categoryId"), imageUrl: "", options: formValue(formData, "options"),
    isFeatured: formBoolean(formData, "isFeatured"), isActive: formData.has("isActive") ? formBoolean(formData, "isActive") : true,
    sortOrder: formSortOrder(formData)
  });
  if (!parsed.success) throw new StoreInputError(parsed.error.issues[0]?.message ?? "Confira os dados do produto.");
  const data = parsed.data;
  const db = getDb();
  return db.transaction(async (tx) => {
    if (data.categoryId) {
      const [category] = await tx.select({ id: categories.id }).from(categories)
        .where(and(eq(categories.id, data.categoryId), eq(categories.storeId, store.id))).limit(1);
      if (!category) throw new StoreInputError("Selecione uma categoria desta loja.");
    }
    const slug = await uniqueSlug(tx, store.id, data.name);
    const [product] = await tx.insert(products).values({
      storeId: store.id, categoryId: data.categoryId || null, name: data.name, slug,
      description: data.description, priceCents: data.price, isFeatured: data.isFeatured,
      isActive: data.isActive, sortOrder: data.sortOrder
    }).returning();
    if (data.options.length) await tx.insert(productVariants).values(data.options.map((value, sortOrder) => ({ productId: product.id, value, sortOrder })));
    return product;
  });
}

export async function updateProductForStore(storeSlug: string, productId: string, formData: FormData) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const parsed = productInputSchema.safeParse({
    name: formValue(formData, "name"), description: formValue(formData, "description"), price: formValue(formData, "price"),
    categoryId: formValue(formData, "categoryId"), imageUrl: "", options: formValue(formData, "options"),
    isFeatured: formBoolean(formData, "isFeatured"), isActive: formBoolean(formData, "isActive"), sortOrder: formSortOrder(formData)
  });
  if (!parsed.success) throw new StoreInputError(parsed.error.issues[0]?.message ?? "Confira os dados do produto.");
  const data = parsed.data;
  const db = getDb();
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: products.id }).from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, store.id))).limit(1);
    if (!existing) throw new StoreInputError("Produto não encontrado nesta loja.");
    if (data.categoryId) {
      const [category] = await tx.select({ id: categories.id }).from(categories)
        .where(and(eq(categories.id, data.categoryId), eq(categories.storeId, store.id))).limit(1);
      if (!category) throw new StoreInputError("Selecione uma categoria desta loja.");
    }
    const slug = await uniqueSlug(tx, store.id, data.name, productId);
    const [product] = await tx.update(products).set({
      categoryId: data.categoryId || null, name: data.name, slug, description: data.description,
      priceCents: data.price, isFeatured: data.isFeatured, isActive: data.isActive,
      sortOrder: data.sortOrder, updatedAt: new Date()
    }).where(and(eq(products.id, productId), eq(products.storeId, store.id))).returning();
    await tx.delete(productVariants).where(eq(productVariants.productId, productId));
    if (data.options.length) await tx.insert(productVariants).values(data.options.map((value, sortOrder) => ({ productId, value, sortOrder })));
    return product;
  });
}

export async function deleteProductForStore(storeSlug: string, productId: string) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const db = getDb();
  const oldImages = await db.select({ imageUrl: productImages.imageUrl }).from(productImages)
    .innerJoin(products, eq(products.id, productImages.productId))
    .where(and(eq(products.id, productId), eq(products.storeId, store.id)));
  const [removed] = await db.delete(products)
    .where(and(eq(products.id, productId), eq(products.storeId, store.id))).returning({ id: products.id });
  if (!removed) throw new StoreInputError("Produto não encontrado nesta loja.");
  await deleteProductBlobsAfterProductRemoval(store.id, productId, oldImages.map((image) => image.imageUrl));
}

export async function setProductActiveForStore(storeSlug: string, productId: string, isActive: boolean) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const [updated] = await getDb().update(products).set({ isActive, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.storeId, store.id))).returning({ id: products.id });
  if (!updated) throw new StoreInputError("Produto não encontrado nesta loja.");
}

export async function createCategoryForStore(storeSlug: string, formData: FormData) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_CATEGORIES");
  const parsed = categoryInputSchema.safeParse({ name: formValue(formData, "name"), description: formValue(formData, "description"), sortOrder: formSortOrder(formData), isActive: true });
  if (!parsed.success) throw new StoreInputError(parsed.error.issues[0]?.message ?? "Confira os dados da categoria.");
  const db = getDb();
  return db.transaction(async (tx) => {
    const slug = await uniqueCategorySlug(tx, store.id, parsed.data.name);
    const [category] = await tx.insert(categories).values({ storeId: store.id, ...parsed.data, slug }).returning();
    return category;
  });
}

export async function updateCategoryForStore(storeSlug: string, categoryId: string, formData: FormData) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_CATEGORIES");
  const parsed = categoryInputSchema.safeParse({ name: formValue(formData, "name"), description: formValue(formData, "description"), sortOrder: formSortOrder(formData), isActive: formBoolean(formData, "isActive") });
  if (!parsed.success) throw new StoreInputError(parsed.error.issues[0]?.message ?? "Confira os dados da categoria.");
  return getDb().transaction(async (tx) => {
    const slug = await uniqueCategorySlug(tx, store.id, parsed.data.name, categoryId);
    const [category] = await tx.update(categories).set({ ...parsed.data, slug, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.storeId, store.id))).returning();
    if (!category) throw new StoreInputError("Categoria não encontrada nesta loja.");
    return category;
  });
}

export async function deleteCategoryForStore(storeSlug: string, categoryId: string) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_CATEGORIES");
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(products).set({ categoryId: null, updatedAt: new Date() })
      .where(and(eq(products.storeId, store.id), eq(products.categoryId, categoryId)));
    const [removed] = await tx.delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.storeId, store.id))).returning({ id: categories.id });
    if (!removed) throw new StoreInputError("Categoria não encontrada nesta loja.");
  });
}

export async function updateStoreForUser(storeSlug: string, formData: FormData) {
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_SETTINGS");
  const storeParsed = updateStoreSchema.safeParse({
    name: formValue(formData, "name"), description: formValue(formData, "description"),
    storefrontType: formValue(formData, "storefrontType"), whatsappNumber: formValue(formData, "whatsappNumber"),
    primaryColor: formValue(formData, "primaryColor"), currentSlug: storeSlug,
    headline: formValue(formData, "headline"), subtitle: formValue(formData, "subtitle"),
    secondaryColor: formValue(formData, "secondaryColor"), deliveryEnabled: formBoolean(formData, "deliveryEnabled"),
    pickupEnabled: formBoolean(formData, "pickupEnabled"), logoUrl: formValue(formData, "logoUrl"), coverUrl: formValue(formData, "coverUrl")
  });
  if (!storeParsed.success) throw new StoreInputError(storeParsed.error.issues[0]?.message ?? "Confira as configurações.");
  const data = storeParsed.data;
  const settings = storeSettingsSchema.safeParse({
    primaryColor: data.primaryColor, secondaryColor: data.secondaryColor, headline: data.headline,
    subtitle: data.subtitle, deliveryEnabled: data.deliveryEnabled, pickupEnabled: data.pickupEnabled, openingHours: {}
  });
  if (!settings.success) throw new StoreInputError("Confira as cores e informações da loja.");
  const db = getDb();
  await Promise.all([
    validateStoreAppearanceImageUrl(data.logoUrl, store.id, "logo"),
    validateStoreAppearanceImageUrl(data.coverUrl, store.id, "cover")
  ]);
  await db.transaction(async (tx) => {
    await tx.update(stores).set({
      name: data.name, description: data.description, storefrontType: data.storefrontType,
      whatsappNumber: data.whatsappNumber, logoUrl: data.logoUrl || null, coverUrl: data.coverUrl || null, updatedAt: new Date()
    }).where(eq(stores.id, store.id));
    await tx.insert(storeSettings).values({ storeId: store.id, ...settings.data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: storeSettings.storeId, set: {
        primaryColor: settings.data.primaryColor, secondaryColor: settings.data.secondaryColor,
        headline: settings.data.headline, subtitle: settings.data.subtitle,
        deliveryEnabled: settings.data.deliveryEnabled, pickupEnabled: settings.data.pickupEnabled,
        updatedAt: new Date()
      } });
  });
  await deleteReplacedStoreAppearanceImages(store.id, { logoUrl: store.logoUrl, coverUrl: store.coverUrl }, { logoUrl: data.logoUrl, coverUrl: data.coverUrl });
  return store.slug;
}

export async function setStorePublication(storeSlug: string, isPublished: boolean) {
  const { store } = await requireAuthorizedStore(storeSlug, "PUBLISH_STORE");
  await getDb().update(stores).set({ status: isPublished ? "PUBLISHED" : "DRAFT", updatedAt: new Date() })
    .where(eq(stores.id, store.id));
}
