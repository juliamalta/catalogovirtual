import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";

vi.mock("@/lib/auth/session", () => ({ getCurrentSession: vi.fn() }));

import { Pool } from "@neondatabase/serverless";
import { getCurrentSession } from "@/lib/auth/session";
import { getDb, closeDbPool } from "@/lib/db";
import { categories, productImages, products, storeMembers, stores, users } from "@/lib/db/schema";
import { getPublicStoreBySlug } from "@/server/queries/store.queries";
import { requireAuthorizedStore } from "@/server/authorization";
import { createCategoryForStore, createProductForStore, createStoreForUser, updateProductForStore, StoreInputError } from "@/server/services/store.service";
import { authorizeProductImageUpload, makeProductImagePrimaryForUser, ProductImageStorageError, removeProductImageForUser } from "@/server/services/blob-storage.service";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const expectedDatabaseName = process.env.TEST_DATABASE_NAME;
const originalDatabaseUrl = process.env.DATABASE_URL;
const integrationEnabled = process.env.RUN_TENANT_INTEGRATION_TESTS === "YES" && Boolean(testDatabaseUrl && expectedDatabaseName);
const integration = integrationEnabled ? describe : describe.skip;
const mockedSession = vi.mocked(getCurrentSession);

integration("multi-tenant database authorization (isolated test database only)", () => {
  const suffix = crypto.randomUUID();
  const ownerA = `tenant-owner-a-${suffix}`;
  const ownerB = `tenant-owner-b-${suffix}`;
  const memberA = `tenant-member-a-${suffix}`;
  const createdStoreIds: string[] = [];
  const createdUserIds = [ownerA, ownerB, memberA];
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

    const probe = new Pool({ connectionString: testDatabaseUrl, max: 1, connectionTimeoutMillis: 5000 });
    try {
      const result = await probe.query<{ name: string }>("select current_database() as name");
      if (result.rows[0]?.name !== expectedDatabaseName) {
        throw new Error("Connected database name does not match TEST_DATABASE_NAME; no fixtures were written.");
      }
    } finally {
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
});
