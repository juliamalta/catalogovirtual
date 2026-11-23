import { getDeliverySettings } from "@/server/queries/delivery.queries";
import { isProductAvailableToday } from "@/features/products/product-availability";
import { parseBusinessHoursConfiguration } from "@/lib/validations/business-hours";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, productAvailabilityDays, productImages, productOptionGroups, productOptions, productPriceRuleOptions, productPriceRules, products, productVariants, storeMembers, storeSettings, stores } from "@/lib/db/schema";
import type { StorePublicDTO } from "@/types/store.types";
import { calculateStoreOperatingStatus } from "@/server/services/business-hours.service";
import type { ProductConfigurationDTO, ProductType } from "@/types/product-configuration.types";
import { notFound } from "next/navigation";
import { requireAuthorizedStore, requireStoreMembership, requireUser } from "@/server/authorization";

export async function getStoresForUser(userId: string) {
  const user = await requireUser();
  if (user.id !== userId) notFound();
  return getDb().select({ id: stores.id, name: stores.name, slug: stores.slug, status: stores.status, storefrontType: stores.storefrontType, role: storeMembers.role })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, userId))
    .orderBy(asc(stores.createdAt));
}

export async function getStoreCounts(storeId: string) {
  await requireStoreMembership(storeId, "VIEW_DASHBOARD");
  const db = getDb();
  const [productCount] = await db.select({ value: count() }).from(products).where(eq(products.storeId, storeId));
  const [categoryCount] = await db.select({ value: count() }).from(categories).where(eq(categories.storeId, storeId));
  return { products: productCount?.value ?? 0, categories: categoryCount?.value ?? 0 };
}

export async function getStoreCategories(storeId: string) {
  await requireStoreMembership(storeId, "VIEW_DASHBOARD");
  return getDb().select().from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getStoreProducts(storeId: string) {
  await requireStoreMembership(storeId, "VIEW_DASHBOARD");
  const db = getDb();
  // Keep the product list projection explicit; configuration rows are loaded
  // separately for the edit screen so list rendering stays lightweight.
  const rows = await db.select({
    product: {
      id: products.id,
      storeId: products.storeId,
      categoryId: products.categoryId,
      name: products.name,
      slug: products.slug,
      description: products.description,
      priceCents: products.priceCents,
      availabilityMode: products.availabilityMode,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      sortOrder: products.sortOrder,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt
    },
    categoryName: categories.name
  })
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

export async function getProductConfigurationForStore(storeId: string, productId: string): Promise<(ProductConfigurationDTO & { productType: ProductType }) | null> {
  await requireStoreMembership(storeId, "MANAGE_PRODUCTS");
  return (await getProductConfigurationsForStore(storeId, [productId])).get(productId) ?? null;
}

async function getProductConfigurationsForStore(storeId: string, productIds: string[]) {
  if (!productIds.length) return new Map<string, ProductConfigurationDTO & { productType: ProductType }>();
  const db = getDb();
  const productRows = await db.select({ id: products.id, availabilityMode: products.availabilityMode }).from(products)
    .where(and(inArray(products.id, productIds), eq(products.storeId, storeId)));

  const [days, groups, rules] = await Promise.all([
    db.select({ productId: productAvailabilityDays.productId, dayOfWeek: productAvailabilityDays.dayOfWeek }).from(productAvailabilityDays)
      .where(and(eq(productAvailabilityDays.storeId, storeId), inArray(productAvailabilityDays.productId, productIds))),
    db.select().from(productOptionGroups)
      .where(and(eq(productOptionGroups.storeId, storeId), inArray(productOptionGroups.productId, productIds)))
      .orderBy(asc(productOptionGroups.sortOrder), asc(productOptionGroups.createdAt)),
    db.select().from(productPriceRules)
      .where(and(eq(productPriceRules.storeId, storeId), inArray(productPriceRules.productId, productIds)))
      .orderBy(asc(productPriceRules.sortOrder), asc(productPriceRules.createdAt))
  ]);
  const groupIds = groups.map((group) => group.id);
  const [options, ruleOptions] = groupIds.length ? await Promise.all([
    db.select().from(productOptions)
      .where(and(eq(productOptions.storeId, storeId), inArray(productOptions.productId, productIds), inArray(productOptions.groupId, groupIds)))
      .orderBy(asc(productOptions.sortOrder), asc(productOptions.createdAt)),
    db.select().from(productPriceRuleOptions)
      .where(and(eq(productPriceRuleOptions.storeId, storeId), inArray(productPriceRuleOptions.productId, productIds)))
  ]) : [[], []];
  const optionsByGroup = new Map<string, typeof options>();
  for (const option of options) optionsByGroup.set(option.groupId, [...(optionsByGroup.get(option.groupId) ?? []), option]);
  const optionIdsByRule = new Map<string, string[]>();
  for (const relation of ruleOptions) optionIdsByRule.set(relation.priceRuleId, [...(optionIdsByRule.get(relation.priceRuleId) ?? []), relation.optionId]);
  return new Map(productRows.map((product) => {
    const optionGroups = groups.filter((group) => group.productId === product.id).map((group) => ({
      id: group.id,
      name: group.name,
      kind: group.kind,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      options: (optionsByGroup.get(group.id) ?? []).map((option) => ({
        id: option.id,
        name: option.name,
        priceCents: option.priceCents,
        priceDeltaCents: option.priceDeltaCents,
        isActive: option.isActive,
        sortOrder: option.sortOrder
      }))
    }));
    const priceRules = rules.filter((rule) => rule.productId === product.id).map((rule) => ({
      id: rule.id,
      name: rule.name,
      priceCents: rule.priceCents,
      optionIds: optionIdsByRule.get(rule.id) ?? [],
      isActive: rule.isActive,
      sortOrder: rule.sortOrder
    }));
    const productType: ProductType = optionGroups.length === 0
      ? "SIMPLE"
      : optionGroups.every((group) => group.kind === "VARIANT") && priceRules.length === 0
        ? "VARIATIONS"
        : "BUILDABLE";

    return [product.id, {
      availabilityMode: product.availabilityMode,
      availableDays: days.filter((day) => day.productId === product.id).map((day) => day.dayOfWeek).sort((left, right) => left - right),
      optionGroups,
      priceRules,
      productType
    }] as const;
  }));
}

export async function getPublicStoreBySlug(slug: string, includeDraft = false): Promise<StorePublicDTO | null> {
  if (includeDraft) await requireAuthorizedStore(slug, "VIEW_DASHBOARD");
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
  const activeProducts = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    name: products.name,
    description: products.description,
    priceCents: products.priceCents,
    isFeatured: products.isFeatured
  }).from(products)
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
  // Expose the saved choices to the public selector; never infer a ready-made meal.
  const configurations = await getProductConfigurationsForStore(result.id, productIds);
  // Public React props are observable even when the selector hides a choice.
  // Keep the editor's full configuration private, including inactive prices.
  for (const [productId, configuration] of configurations) {
    const optionGroups = configuration.optionGroups.filter((group) => group.isActive)
      .map((group) => ({ ...group, options: group.options.filter((option) => option.isActive) }));
    const visibleOptionIds = new Set(optionGroups.flatMap((group) => group.options.map((option) => option.id)));
    configurations.set(productId, { ...configuration, optionGroups,
      priceRules: configuration.priceRules.filter((rule) => rule.isActive && rule.optionIds.every((id) => visibleOptionIds.has(id))) });
  }
  const now = new Date();
  const timeZone = parseBusinessHoursConfiguration(result.settings?.openingHours)?.timeZone ?? "America/Sao_Paulo";

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
    delivery: (await getDeliverySettings(result.id, { deliveryEnabled: result.settings?.deliveryEnabled ?? false, pickupEnabled: result.settings?.pickupEnabled ?? true })).configuration,
    operatingStatus: calculateStoreOperatingStatus(result.settings?.openingHours, now),
    products: activeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      image: productImageList.get(product.id)?.[0] ?? "",
      images: productImageList.get(product.id) ?? [],
      category: product.categoryId ? categoryNames.get(product.categoryId) ?? "" : "",
      ...(product.isFeatured ? { badge: "Destaque" } : {}),
      productType: configurations.get(product.id)?.productType,
      configuration: configurations.get(product.id) ?? undefined,
      unavailable: !isProductAvailableToday(configurations.get(product.id), now, timeZone),
      options: options.get(product.id) ?? []
    }))
  };
}
