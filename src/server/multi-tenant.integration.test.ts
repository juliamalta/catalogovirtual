import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq, inArray, sql } from "drizzle-orm";

vi.mock("@/lib/auth/session", () => ({ getCurrentSession: vi.fn() }));

import { Pool } from "@neondatabase/serverless";
import { getCurrentSession } from "@/lib/auth/session";
import { getDb, closeDbPool } from "@/lib/db";
import { categories, productAvailabilityDays, productImages, productOptionGroups, productOptions, productPriceRuleOptions, productPriceRules, products, storeMembers, stores, users } from "@/lib/db/schema";
import { getProductConfigurationForStore, getPublicStoreBySlug, getStoreCategories, getStoreProducts, getStoresForUser } from "@/server/queries/store.queries";
import { lockStorePermission, requireAuthorizedStore, requireStoreMembership } from "@/server/authorization";
import { createCategoryForStore, createProductForStore, createStoreForUser, deleteCategoryForStore, setStorePublication, updateStoreForUser, updateStoreBusinessHours, updateProductForStore, StoreInputError } from "@/server/services/store.service";
import { replaceProductConfiguration } from "@/server/services/product-configuration.service";
import { getDeliverySettings } from "@/server/queries/delivery.queries";
import { authorizeProductImageUpload, makeProductImagePrimaryForUser, ProductImageStorageError, removeProductImageForUser } from "@/server/services/blob-storage.service";
import { validateTestDatabaseEnvironment } from "../../scripts/lib/test-database-safety.mjs";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const expectedDatabaseName = process.env.TEST_DATABASE_NAME;
const originalDatabaseUrl = process.env.DATABASE_URL;
const integrationEnabled = Boolean(validateTestDatabaseEnvironment(process.env));
const integration = integrationEnabled ? describe : describe.skip;
const mockedSession = vi.mocked(getCurrentSession);

integration("multi-tenant database authorization (isolated test database only)", () => {
  const suffix = crypto.randomUUID();
  const ownerA = `tenant-owner-a-${suffix}`;
  const ownerB = `tenant-owner-b-${suffix}`;
  const memberA = `tenant-member-a-${suffix}`;
  const adminA = `tenant-admin-a-${suffix}`;
  const createdStoreIds: string[] = [];
  const createdUserIds = [ownerA, ownerB, memberA, adminA];
  let database: ReturnType<typeof getDb> | undefined;
  let storeA: Awaited<ReturnType<typeof createStoreForUser>>;
  let storeB: Awaited<ReturnType<typeof createStoreForUser>>;
  let categoryB: typeof categories.$inferSelect;
  let productB: { id: string; name: string };

  function authenticateAs(userId: string) {
    mockedSession.mockResolvedValue({ user: { id: userId } } as never);
  }

  beforeAll(async () => {
    if (!testDatabaseUrl || !expectedDatabaseName || !expectedDatabaseName.endsWith("_test")) {
      throw new Error("Use TEST_DATABASE_URL and a TEST_DATABASE_NAME ending in _test for isolated integration tests.");
    }

    const parseDatabaseUrl = (value: string) => {
      try { return new URL(value); }
      catch { throw new Error("Invalid isolated database configuration; credentials suppressed."); }
    };
    const target = parseDatabaseUrl(testDatabaseUrl);
    if (!['postgres:', 'postgresql:'].includes(target.protocol) || decodeURIComponent(target.pathname.slice(1)) !== expectedDatabaseName || expectedDatabaseName === 'neondb') {
      throw new Error("The isolated PostgreSQL URL must identify the expected _test database; no fixtures were written.");
    }
    if (originalDatabaseUrl) {
      const primary = parseDatabaseUrl(originalDatabaseUrl);
      if (primary.hostname.replace('-pooler', '') === target.hostname.replace('-pooler', '') && primary.pathname === target.pathname) {
        throw new Error("Integration tests cannot use the primary database; no fixtures were written.");
      }
    }

    const probe = new Pool({ connectionString: testDatabaseUrl, max: 1, connectionTimeoutMillis: 5000 });
    const client = await probe.connect();
    try {
      await client.query("BEGIN READ ONLY");
      const result = await client.query<{ name: string }>("select current_database() as name");
      if (result.rows[0]?.name !== expectedDatabaseName) {
        throw new Error("Connected database name does not match TEST_DATABASE_NAME; no fixtures were written.");
      }
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
      await probe.end();
    }

    process.env.DATABASE_URL = testDatabaseUrl;
    database = getDb();
    await database.insert(users).values(createdUserIds.map((id) => ({
      id, name: id, email: `${id}@integration.invalid`, emailVerified: true
    })));

    authenticateAs(ownerA);
    storeA = await createStoreForUser({ name: "Tenant A", slug: `tenant-a-${suffix}`, description: "", storefrontType: "CATALOG", whatsappNumber: "5511999999999", primaryColor: "#7351D6" });
    createdStoreIds.push(storeA.id);
    authenticateAs(ownerB);
    storeB = await createStoreForUser({ name: "Tenant B", slug: `tenant-b-${suffix}`, description: "", storefrontType: "CATALOG", whatsappNumber: "5511999999999", primaryColor: "#7351D6" });
    createdStoreIds.push(storeB.id);

    await database.insert(storeMembers).values({ storeId: storeA.id, userId: memberA, role: "MEMBER" });
    await database.insert(storeMembers).values({ storeId: storeA.id, userId: adminA, role: "ADMIN" });
    authenticateAs(ownerB);
    const categoryForm = new FormData();
    categoryForm.set("name", "Privada B");
    categoryB = await createCategoryForStore(storeB.slug, categoryForm);
    const productForm = new FormData();
    productForm.set("name", "Produto privado B");
    productForm.set("description", "fixture");
    productForm.set("price", "10,00");
    productForm.set("categoryId", categoryB.id);
    productForm.set("imageUrl", "");
    productForm.set("options", "");
    productForm.set("isActive", "on");
    productForm.set("isFeatured", "");
    productForm.set("sortOrder", "0");
    const created = await createProductForStore(storeB.slug, productForm);
    productB = { id: created.id, name: created.name };
  }, 30_000);

  afterAll(async () => {
    if (database) {
      if (createdStoreIds.length) await database.delete(stores).where(inArray(stores.id, createdStoreIds));
      await database.delete(users).where(inArray(users.id, createdUserIds));
      await closeDbPool();
    }
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }, 30_000);

  it("rejects membership and administrative access across stores", async () => {
    authenticateAs(ownerA);
    await expect(requireAuthorizedStore(storeB.slug, "VIEW_DASHBOARD")).rejects.toThrow();
    await expect(requireAuthorizedStore(storeB.slug, "MANAGE_PRODUCTS")).rejects.toThrow();
  });

  it("does not let a member mutate a store or an owner edit another store's product", async () => {
    authenticateAs(memberA);
    await expect(updateProductForStore(storeA.slug, productB.id, new FormData())).rejects.toThrow();

    authenticateAs(ownerA);
    const attemptedEdit = new FormData();
    attemptedEdit.set("name", "Tentativa de invasão");
    attemptedEdit.set("price", "1,00");
    attemptedEdit.set("categoryId", "");
    attemptedEdit.set("imageUrl", "");
    attemptedEdit.set("options", "");
    attemptedEdit.set("isActive", "on");
    attemptedEdit.set("isFeatured", "");
    attemptedEdit.set("sortOrder", "0");
    await expect(updateProductForStore(storeA.slug, productB.id, attemptedEdit)).rejects.toBeInstanceOf(StoreInputError);
    const [unchanged] = await database!.select({ name: products.name }).from(products).where(eq(products.id, productB.id));
    expect(unchanged?.name).toBe(productB.name);
  });

  it("keeps unpublished stores out of public lookup", async () => {
    expect(await getPublicStoreBySlug(storeB.slug)).toBeNull();
  });

  it("persists and reloads restaurant variations, groups, combination prices, and availability", async () => {
    authenticateAs(ownerA);
    const sizeGroupId = crypto.randomUUID();
    const choiceGroupId = crypto.randomUUID();
    const smallId = crypto.randomUUID();
    const largeId = crypto.randomUUID();
    const chickenId = crypto.randomUUID();
    const beefId = crypto.randomUUID();
    const productForm = new FormData();
    productForm.set("name", "Marmita configurável");
    productForm.set("description", "Configuração de integração isolada");
    productForm.set("price", "99,00");
    productForm.set("categoryId", "");
    productForm.set("imageUrl", "");
    productForm.set("options", "");
    productForm.set("isActive", "on");
    productForm.set("isFeatured", "");
    productForm.set("sortOrder", "0");
    productForm.set("productType", "BUILDABLE");
    productForm.set("productConfiguration", JSON.stringify({
      availability: { mode: "WEEKDAYS", days: [1, 2, 3, 4, 5] },
      optionGroups: [
        { id: sizeGroupId, name: "Tamanho", kind: "VARIANT", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [
          { id: smallId, name: "Pequena", priceCents: 2_000, priceDeltaCents: 0, isActive: true, sortOrder: 0 },
          { id: largeId, name: "Grande", priceCents: 2_500, priceDeltaCents: 0, isActive: true, sortOrder: 1 }
        ] },
        { id: choiceGroupId, name: "Proteína", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 1, options: [
          { id: chickenId, name: "Frango", priceDeltaCents: 0, isActive: true, sortOrder: 0 },
          { id: beefId, name: "Carne", priceDeltaCents: 0, isActive: true, sortOrder: 1 }
        ] }
      ],
      priceRules: [
        { name: "Pequena com frango", priceCents: 2_200, optionIds: [smallId, chickenId], isActive: true, sortOrder: 0 },
        { name: "Pequena com carne", priceCents: 2_400, optionIds: [smallId, beefId], isActive: true, sortOrder: 1 }
      ]
    }));

    const product = await createProductForStore(storeA.slug, productForm);
    const saved = await getProductConfigurationForStore(storeA.id, product.id);
    expect(saved).toMatchObject({
      productType: "BUILDABLE",
      availabilityMode: "WEEKDAYS",
      availableDays: [1, 2, 3, 4, 5],
      optionGroups: [{ name: "Tamanho" }, { name: "Proteína" }],
      priceRules: [{ name: "Pequena com frango", priceCents: 2_200 }, { name: "Pequena com carne", priceCents: 2_400 }]
    });
    expect(saved!.optionGroups[0]!.id).not.toBe(sizeGroupId);
    expect(saved!.optionGroups[0]!.options[0]!.id).not.toBe(smallId);
    expect(await database!.select().from(productOptionGroups).where(eq(productOptionGroups.productId, product.id))).toHaveLength(2);
    expect(await database!.select().from(productOptions).where(eq(productOptions.productId, product.id))).toHaveLength(4);
    expect(await database!.select().from(productPriceRules).where(eq(productPriceRules.productId, product.id))).toHaveLength(2);
    expect(await database!.select().from(productPriceRuleOptions).where(eq(productPriceRuleOptions.productId, product.id))).toHaveLength(4);
    expect(await database!.select().from(productAvailabilityDays).where(eq(productAvailabilityDays.productId, product.id))).toHaveLength(5);

    const updateConfig = {
      availability: { mode: saved!.availabilityMode, days: saved!.availableDays },
      optionGroups: saved!.optionGroups,
      priceRules: saved!.priceRules
    };
    updateConfig.priceRules[0].priceCents = 2_300;
    productForm.set("productConfiguration", JSON.stringify(updateConfig));
    productForm.set("productConfigurationDeletes", JSON.stringify({ groupIds: [], optionIds: [], priceRuleIds: [] }));
    await updateProductForStore(storeA.slug, product.id, productForm);
    const afterPriceEdit = await getProductConfigurationForStore(storeA.id, product.id);
    expect(afterPriceEdit?.priceRules[0]?.priceCents).toBe(2_300);
    expect(afterPriceEdit?.optionGroups[0]?.id).toBe(saved!.optionGroups[0]!.id);
    expect(afterPriceEdit?.optionGroups[0]?.options[0]?.id).toBe(saved!.optionGroups[0]!.options[0]!.id);

    productForm.set("productConfiguration", JSON.stringify({
      availability: { mode: afterPriceEdit!.availabilityMode, days: afterPriceEdit!.availableDays },
      optionGroups: afterPriceEdit!.optionGroups,
      priceRules: afterPriceEdit!.priceRules.slice(0, 1)
    }));
    productForm.set("productConfigurationDeletes", JSON.stringify({ groupIds: [], optionIds: [], priceRuleIds: [afterPriceEdit!.priceRules[1]!.id] }));
    await updateProductForStore(storeA.slug, product.id, productForm);
    expect((await getProductConfigurationForStore(storeA.id, product.id))?.priceRules).toHaveLength(1);

    await expect(getProductConfigurationForStore(storeB.id, product.id)).rejects.toThrow();
    await expect(getProductConfigurationForStore(storeA.id, productB.id)).resolves.toBeNull();
  });

  it("rolls back product and groups when the server rejects a price-rule relation", async () => {
    const rollbackProductId = crypto.randomUUID();
    const invalidOptionId = crypto.randomUUID();
    await expect(database!.transaction(async (tx) => {
      await tx.insert(products).values({
        id: rollbackProductId, storeId: storeA.id, name: "Produto para rollback",
        slug: `rollback-${suffix}`, description: "", priceCents: 0
      });
      await replaceProductConfiguration(tx, storeA.id, rollbackProductId, {
        availability: { mode: "ALWAYS", days: [] },
        optionGroups: [{
          id: crypto.randomUUID(), name: "Grupo", kind: "CUSTOMIZATION", isRequired: false,
          minSelections: 0, maxSelections: 1, isActive: true, sortOrder: 0,
          options: [{ id: crypto.randomUUID(), name: "Opção", priceDeltaCents: 0, sortOrder: 0, isActive: true }]
        }],
        priceRules: [{ id: crypto.randomUUID(), name: "Relação inválida", priceCents: 100, optionIds: [invalidOptionId], sortOrder: 0, isActive: true }]
      } as never, { groupIds: [], optionIds: [], priceRuleIds: [] });
    })).rejects.toThrow();
    expect(await database!.select().from(products).where(eq(products.id, rollbackProductId))).toHaveLength(0);
    expect(await database!.select().from(productOptionGroups).where(eq(productOptionGroups.productId, rollbackProductId))).toHaveLength(0);
  });

  it("requires a session and MANAGE_PRODUCTS permission before issuing an image upload token", async () => {
    const payload = { storeSlug: storeB.slug, productId: productB.id, mimeType: "image/jpeg", size: 1024 };
    const pathname = `stores/${storeB.id}/products/${productB.id}/${crypto.randomUUID()}.jpg`;

    mockedSession.mockResolvedValue(null as never);
    await expect(authorizeProductImageUpload(payload, pathname)).rejects.toBeInstanceOf(ProductImageStorageError);

    authenticateAs(ownerA);
    await expect(authorizeProductImageUpload(payload, pathname)).rejects.toMatchObject({ status: 403 });

    authenticateAs(memberA);
    await expect(authorizeProductImageUpload(payload, pathname)).rejects.toMatchObject({ status: 403 });

    authenticateAs(ownerB);
    await expect(authorizeProductImageUpload(payload, pathname)).resolves.toMatchObject({ context: { storeId: storeB.id, productId: productB.id } });
    await expect(authorizeProductImageUpload({ ...payload, size: 5 * 1024 * 1024 + 1 }, pathname)).rejects.toBeInstanceOf(ProductImageStorageError);
  });

  it("limits a product to five images, orders the main image first and deletes only authorized rows", async () => {
    const rows = await database!.insert(productImages).values(Array.from({ length: 5 }, (_, sortOrder) => ({
      productId: productB.id,
      imageUrl: `https://legacy.example/${sortOrder}.jpg`,
      altText: `Imagem ${sortOrder + 1}`,
      sortOrder
    }))).returning({ id: productImages.id });
    const payload = { storeSlug: storeB.slug, productId: productB.id, mimeType: "image/jpeg", size: 1024 };
    const pathname = `stores/${storeB.id}/products/${productB.id}/${crypto.randomUUID()}.jpg`;

    authenticateAs(ownerB);
    await expect(authorizeProductImageUpload(payload, pathname)).rejects.toBeInstanceOf(ProductImageStorageError);

    await makeProductImagePrimaryForUser(storeB.slug, productB.id, rows[4].id);
    const ordered = await database!.select({ id: productImages.id, sortOrder: productImages.sortOrder })
      .from(productImages).where(eq(productImages.productId, productB.id)).orderBy(productImages.sortOrder);
    expect(ordered[0]?.id).toBe(rows[4].id);

    authenticateAs(ownerA);
    await expect(removeProductImageForUser(storeA.slug, productB.id, rows[4].id)).rejects.toBeInstanceOf(ProductImageStorageError);
    authenticateAs(ownerB);
    await removeProductImageForUser(storeB.slug, productB.id, rows[4].id);
    const remaining = await database!.select({ id: productImages.id }).from(productImages).where(eq(productImages.productId, productB.id));
    expect(remaining).toHaveLength(4);
  });

  it("protects private queries and draft preview at the query boundary", async () => {
    authenticateAs(ownerA);
    await expect(getStoreCategories(storeB.id)).rejects.toThrow();
    await expect(getStoreProducts(storeB.id)).rejects.toThrow();
    await expect(getStoresForUser(ownerB)).rejects.toThrow();
    await expect(getPublicStoreBySlug(storeB.slug, true)).rejects.toThrow();
    await expect(getDeliverySettings(storeB.id, { deliveryEnabled: true, pickupEnabled: true })).rejects.toThrow();
    mockedSession.mockResolvedValue(null as never);
    await expect(getStoreProducts(storeA.id)).rejects.toThrow();
    await expect(getPublicStoreBySlug(storeA.slug, true)).rejects.toThrow();
  });

  it("does not treat store ADMIN as a global admin or store owner", async () => {
    authenticateAs(adminA);
    await expect(requireAuthorizedStore(storeA.slug, "MANAGE_PRODUCTS")).resolves.toBeTruthy();
    await expect(requireAuthorizedStore(storeB.slug, "VIEW_DASHBOARD")).rejects.toThrow();
    await expect(requireStoreMembership(storeA.id, "MANAGE_MEMBERS")).rejects.toThrow();
    await expect(requireStoreMembership(storeA.id, "DELETE_STORE")).rejects.toThrow();
  });

  it("rejects cross-store category deletion and image IDs without changing B", async () => {
    authenticateAs(ownerA);
    const beforeCategory = await database!.select().from(categories).where(eq(categories.id, categoryB.id));
    const beforeImages = await database!.select().from(productImages).where(eq(productImages.productId, productB.id));
    await expect(deleteCategoryForStore(storeA.slug, categoryB.id)).rejects.toThrow();
    await expect(removeProductImageForUser(storeA.slug, productB.id, crypto.randomUUID())).rejects.toThrow();
    expect(await database!.select().from(categories).where(eq(categories.id, categoryB.id))).toEqual(beforeCategory);
    expect(await database!.select().from(productImages).where(eq(productImages.productId, productB.id))).toEqual(beforeImages);
  });

  it("rejects foreign settings, WhatsApp, hours, freight and publication writes", async () => {
    authenticateAs(ownerA);
    const before = await database!.select().from(stores).where(eq(stores.id, storeB.id));
    const settings = new FormData(); settings.set("whatsappNumber", "5511888888888");
    settings.set("deliveryEnabled", "true"); settings.set("deliveryFeeType", "FIXED"); settings.set("deliveryFixedFee", "9,00");
    await expect(updateStoreForUser(storeB.slug, settings)).rejects.toThrow();
    await expect(updateStoreBusinessHours(storeB.slug, {})).rejects.toThrow();
    await expect(setStorePublication(storeB.slug, true)).rejects.toThrow();
    expect(await database!.select().from(stores).where(eq(stores.id, storeB.id))).toEqual(before);
  });

  it("enforces composite tenant foreign keys in PostgreSQL itself", async () => {
    const productId = crypto.randomUUID();
    await expect(database!.insert(products).values({ id: productId, storeId: storeA.id, categoryId: categoryB.id, name: "Invalid tenant relation", slug: `invalid-${suffix}`, priceCents: 100 })).rejects.toThrow();
    expect(await database!.select().from(products).where(eq(products.id, productId))).toHaveLength(0);
    await expect(database!.insert(productOptionGroups).values({ storeId: storeA.id, productId: productB.id, name: "Invalid group", kind: "CUSTOMIZATION" })).rejects.toThrow();
  });

  it("rejects foreign group, option and rule IDs atomically instead of cloning them", async () => {
    const formFor = (groupId: string, optionId: string, ruleId?: string) => {
      const f = new FormData(); f.set("name", `Fixture isolation ${groupId}`); f.set("price", "12,50"); f.set("productType", "BUILDABLE"); f.set("isActive", "true");
      f.set("productConfiguration", JSON.stringify({ availability: { mode: "ALWAYS", days: [] }, optionGroups: [{ id: groupId, name: "Carne", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [{ id: optionId, name: "Frango", priceDeltaCents: 0, isActive: true, sortOrder: 0 }] }], priceRules: ruleId ? [{ id: ruleId, name: "Combo", priceCents: 1250, optionIds: [optionId], isActive: true, sortOrder: 0 }] : [] })); return f;
    };
    authenticateAs(ownerB);
    const foreign = await createProductForStore(storeB.slug, formFor(crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()));
    authenticateAs(ownerA);
    const own = await createProductForStore(storeA.slug, formFor(crypto.randomUUID(), crypto.randomUUID()));
    const original = await getProductConfigurationForStore(storeA.id, own.id);
    const ga = own.productConfiguration.optionGroups[0]!, oa = ga.options[0]!;
    const gb = foreign.productConfiguration.optionGroups[0]!, ob = gb.options[0]!, rb = foreign.productConfiguration.priceRules[0]!;
    for (const resource of ["group", "option", "rule"]) {
      const f = formFor(resource === "group" ? gb.id : ga.id, resource === "group" || resource === "option" ? ob.id : oa.id, resource === "rule" ? rb.id : undefined);
      f.set("productConfigurationDeletes", JSON.stringify({ groupIds: resource === "group" ? [ga.id] : [], optionIds: resource === "option" ? [oa.id] : [], priceRuleIds: [] }));
      await expect(updateProductForStore(storeA.slug, own.id, f)).rejects.toThrow();
      expect(await getProductConfigurationForStore(storeA.id, own.id)).toEqual(original);
    }
  });

  it("holds the membership row against concurrent revocation until the authorized transaction ends", async () => {
    let signalReady = () => {}; let release = () => {};
    const ready = new Promise<void>((resolve) => { signalReady = resolve; });
    const released = new Promise<void>((resolve) => { release = resolve; });
    const revoker = new Pool({ connectionString: testDatabaseUrl!, max: 1, connectionTimeoutMillis: 5000 });
    const connection = await revoker.connect().catch(async () => { await revoker.end(); throw new Error("Isolated revocation connection failed; credentials suppressed."); });
    const holder = database!.transaction(async (tx) => { await lockStorePermission(tx, storeA.id, ownerA, "MANAGE_PRODUCTS"); signalReady(); await released; });
    let revoke: Promise<unknown> | undefined;
    try {
      await Promise.race([ready, holder]);
      const backend = await connection.query<{ pid: number }>("select pg_backend_pid() as pid");
      await connection.query("set statement_timeout = '5000ms'");
      revoke = connection.query("update store_members set role='MEMBER' where store_id=$1 and user_id=$2", [storeA.id, ownerA]);
      void revoke.catch(() => undefined);
      let waiting = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const status = await database!.execute<{ wait_event_type: string | null }>(sql`select wait_event_type from pg_stat_activity where pid=${backend.rows[0]!.pid}`);
        if (status.rows[0]?.wait_event_type === "Lock") { waiting = true; break; }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      expect(waiting).toBe(true);
      release(); await holder; await revoke;
      authenticateAs(ownerA);
      await expect(createCategoryForStore(storeA.slug, new FormData())).rejects.toThrow();
    } finally {
      release();
      try { await holder; if (revoke) await revoke; }
      finally {
        connection.release();
        await revoker.end();
        await database!.update(storeMembers).set({ role: "OWNER" }).where(and(eq(storeMembers.storeId, storeA.id), eq(storeMembers.userId, ownerA)));
      }
    }
  }, 15000);

  it("keeps concurrent foreign mutations denied while an own-store operation succeeds", async () => {
    authenticateAs(ownerA);
    const before = await database!.select().from(products).where(eq(products.id, productB.id));
    const category = new FormData(); category.set("name", `Own concurrent ${suffix}`);
    const forged = new FormData(); forged.set("name", "Foreign concurrent edit"); forged.set("price", "1,00"); forged.set("isActive", "true");
    const results = await Promise.allSettled([updateProductForStore(storeA.slug, productB.id, forged), deleteCategoryForStore(storeA.slug, categoryB.id), setStorePublication(storeB.slug, true), createCategoryForStore(storeA.slug, category)]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected", "rejected", "fulfilled"]);
    expect(await database!.select().from(products).where(eq(products.id, productB.id))).toEqual(before);
  });
});
