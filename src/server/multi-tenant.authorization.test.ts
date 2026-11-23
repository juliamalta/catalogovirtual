import { createRequire } from "node:module";
import * as React from "react";
import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductConfigurationInput } from "@/lib/validations/product-configuration";
const state = vi.hoisted(() => ({ actor: "owner-a" as string | null, db: null as unknown, blobDelete: vi.fn(), head: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/auth/session", () => ({ getCurrentSession: async () => state.actor ? { user: { id: state.actor } } : null }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, redirect: (url: string) => { throw new Error("REDIRECT:" + url); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@vercel/blob", () => ({ del: state.blobDelete, head: state.head, issueSignedToken: vi.fn() }));
vi.mock("@/components/storefront/storefront", () => ({ Storefront: () => null }));

import * as service from "./services/store.service";
import * as queries from "./queries/store.queries";
import * as actions from "@/app/painel/actions";
import * as images from "./services/blob-storage.service";
import * as appearance from "./services/store-image-storage.service";
import { requireAuthorizedStore, requireStoreMembership } from "./authorization";
import StorePreviewPage from "@/app/[slug]/preview/page";
import { createDefaultBusinessHours } from "@/lib/validations/business-hours";
import { POST as productUploadPost } from "@/app/api/products/images/upload/route";
import { POST as appearanceUploadPost } from "@/app/api/stores/images/upload/route";
import { getDeliverySettings } from "@/server/queries/delivery.queries";

const { createMemoryDatabase } = createRequire(import.meta.url)("./test-support/memory-db.cjs");
const id = (n: number) => `${n.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
const A = id(1), B = id(2), CA = id(3), CB = id(4), PA = id(5), PB = id(6), GA = id(7), GB = id(8), OA = id(9), OB = id(10), RB = id(12), IB = id(13);
const group = (groupId = GA, optionId = OA) => ({ id: groupId, name: "Carne", kind: "CUSTOMIZATION" as const, isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [{ id: optionId, name: "Frango", priceDeltaCents: 0, isActive: true, sortOrder: 0 }] });
function form(configuration: ProductConfigurationInput = { availability: { mode: "ALWAYS", days: [] }, optionGroups: [group()], priceRules: [] }) {
  const f = new FormData();
  for (const [key, value] of Object.entries({ name: "Produto autorizado", description: "fixture", price: "12,50", categoryId: CA, productType: "BUILDABLE", isActive: "true", sortOrder: "0", productConfiguration: JSON.stringify(configuration) })) f.set(key, value);
  return f;
}
const categoryForm = () => { const f = new FormData(); f.set("name", "Categoria autorizada"); f.set("isActive", "true"); return f; };
const settingsForm = () => { const f = new FormData(); for (const [key, value] of Object.entries({ name: "Loja A", description: "", storefrontType: "MENU", whatsappNumber: "5511999999999", primaryColor: "#2563eb", secondaryColor: "#ffffff", deliveryEnabled: "false", pickupEnabled: "true" })) f.set(key, value); return f; };
function fixture() {
  return createMemoryDatabase({
    stores: [{ id: A, slug: "loja-a", name: "Loja A", status: "DRAFT", storefrontType: "MENU", whatsappNumber: "5511999999999", description: "", logoUrl: null, coverUrl: null }, { id: B, slug: "loja-b", name: "Loja B", status: "DRAFT", storefrontType: "MENU", whatsappNumber: "5511999999999", description: "", logoUrl: null, coverUrl: null }],
    store_members: [{ storeId: A, userId: "owner-a", role: "OWNER" }, { storeId: B, userId: "owner-b", role: "OWNER" }, { storeId: A, userId: "admin-a", role: "ADMIN" }, { storeId: A, userId: "member-a", role: "MEMBER" }],
    categories: [{ id: CA, storeId: A, name: "Categoria A", slug: "a", isActive: true }, { id: CB, storeId: B, name: "Categoria B", slug: "b", isActive: true }],
    products: [{ id: PA, storeId: A, categoryId: CA, name: "Produto A", slug: "a", description: "", priceCents: 1250, isActive: true, isFeatured: false, availabilityMode: "ALWAYS" }, { id: PB, storeId: B, categoryId: CB, name: "Produto B", slug: "b", description: "", priceCents: 2500, isActive: true, isFeatured: false, availabilityMode: "ALWAYS" }],
    store_settings: [{ storeId: A, primaryColor: "#2563eb", secondaryColor: "#ffffff", deliveryEnabled: false, pickupEnabled: true, openingHours: null }, { storeId: B, primaryColor: "#2563eb", secondaryColor: "#ffffff", deliveryEnabled: false, pickupEnabled: true, openingHours: null }],
    product_option_groups: [{ ...group(), storeId: A, productId: PA }, { ...group(GB, OB), storeId: B, productId: PB }],
    product_options: [{ ...group().options[0], storeId: A, productId: PA, groupId: GA, priceCents: null }, { ...group(GB, OB).options[0], storeId: B, productId: PB, groupId: GB, priceCents: null }],
    product_price_rules: [{ id: RB, storeId: B, productId: PB, name: "PRIVATE_FUTURE_PRICE", priceCents: 99, isActive: false, sortOrder: 0 }],
    product_price_rule_options: [{ id: id(14), storeId: B, productId: PB, priceRuleId: RB, optionId: OB }],
    product_variants: [],
    product_images: [{ id: IB, productId: PB, imageUrl: `https://fixture.public.blob.vercel-storage.com/stores/${B}/products/${PB}/${id(30)}.png`, sortOrder: 0 }]
  });
}
let db: ReturnType<typeof fixture>;
beforeEach(async () => { db = await fixture(); state.db = db; state.actor = "owner-a"; vi.clearAllMocks(); vi.stubGlobal("React", React); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("private query boundaries with two tenant fixtures", () => {
  const reads: Array<[string, () => Promise<unknown>]> = [
    ["store list by another user", () => queries.getStoresForUser("owner-b")],
    ["private counts", () => queries.getStoreCounts(B)],
    ["private categories", () => queries.getStoreCategories(B)],
    ["private products", () => queries.getStoreProducts(B)],
    ["private configuration", () => queries.getProductConfigurationForStore(B, PB)],
    ["draft freight", () => getDeliverySettings(B, { deliveryEnabled: true, pickupEnabled: true })],
    ["draft opt-in", () => queries.getPublicStoreBySlug("loja-b", true)]
  ];
  it.each(reads)("denies A reading B through %s", async (_label, read) => { await expect(read()).rejects.toThrow(); });
  it.each(reads)("denies anonymous access through %s", async (_label, read) => { state.actor = null; await expect(read()).rejects.toThrow(); });
  it("allows own reads and preserves member dashboard reads", async () => {
    expect((await queries.getStoreProducts(A))[0].id).toBe(PA);
    expect((await queries.getProductConfigurationForStore(A, PA))?.optionGroups[0].id).toBe(GA);
    state.actor = "member-a";
    expect((await queries.getStoreProducts(A))[0].id).toBe(PA);
    expect((await queries.getStoreCategories(A))[0].id).toBe(CA);
    await expect(StorePreviewPage({ params: Promise.resolve({ slug: "loja-a" }) })).resolves.toBeTruthy();
  });
  it("keeps drafts and inactive products out of anonymous storefronts", async () => {
    state.actor = null; expect(await queries.getPublicStoreBySlug("loja-b")).toBeNull();
    db.rows("stores")[1].status = "PUBLISHED"; db.rows("products")[1].isActive = false;
    expect((await queries.getPublicStoreBySlug("loja-b"))?.products).toEqual([]);
  });
  it("does not serialize inactive options, groups or price rules to public visitors", async () => {
    db.rows("stores")[1].status = "PUBLISHED";
    db.rows("product_options").push({ ...db.rows("product_options")[1], id: id(21), name: "PRIVATE_INACTIVE_OPTION", isActive: false });
    db.rows("product_option_groups").push({ ...db.rows("product_option_groups")[1], id: id(22), name: "PRIVATE_INACTIVE_GROUP", isActive: false });
    db.rows("product_variants").push({ id: id(23), productId: PB, value: "PRIVATE_LEGACY_OPTION", isActive: false, sortOrder: 0 });
    state.actor = null;
    const visible = await queries.getPublicStoreBySlug("loja-b");
    expect(visible?.products[0].name).toBe("Produto B");
    expect(JSON.stringify(visible)).not.toContain("PRIVATE_");
  });
  it("protects the preview route even when the slug is edited manually", async () => {
    await expect(StorePreviewPage({ params: Promise.resolve({ slug: "loja-b" }) })).rejects.toThrow("NOT_FOUND");
    state.actor = null;
    await expect(StorePreviewPage({ params: Promise.resolve({ slug: "loja-a" }) })).rejects.toThrow("REDIRECT:/login");
  });
});

describe("cross-tenant mutations and valid own operations", () => {
  it("denies product edits and removals in B without partial changes", async () => {
    const before = db.snapshot();
    await expect(service.updateProductForStore("loja-a", PB, form())).rejects.toThrow();
    await expect(service.deleteProductForStore("loja-a", PB)).rejects.toThrow();
    await expect(service.setProductActiveForStore("loja-a", PB, false)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("denies foreign category and image deletion or association", async () => {
    const before = db.snapshot(); const f = form(); f.set("categoryId", CB);
    await expect(service.updateProductForStore("loja-a", PA, f)).rejects.toThrow();
    await expect(service.deleteCategoryForStore("loja-a", CB)).rejects.toThrow();
    await expect(images.removeProductImageForUser("loja-a", PB, IB)).rejects.toThrow();
    await expect(images.removeProductImageForUser("loja-a", PA, IB)).rejects.toThrow();
    await expect(images.makeProductImagePrimaryForUser("loja-a", PA, IB)).rejects.toThrow();
    await expect(images.reorderProductImagesForUser("loja-a", PA, [IB])).rejects.toThrow();
    expect(db.snapshot()).toEqual(before); expect(state.blobDelete).not.toHaveBeenCalled();
  });
  it.each(["group", "option", "rule"] as const)("rejects an existing foreign %s ID instead of silently cloning it", async (resource) => {
    const configuration: ProductConfigurationInput = { availability: { mode: "ALWAYS", days: [] }, optionGroups: [group(resource === "group" ? GB : GA, resource === "group" || resource === "option" ? OB : OA)], priceRules: resource === "rule" ? [{ id: RB, name: "Forged rule", priceCents: 1000, optionIds: [OA], isActive: true, sortOrder: 0 }] : [] };
    const f = form(configuration);
    f.set("productConfigurationDeletes", JSON.stringify({ groupIds: resource === "group" ? [GA] : [], optionIds: resource === "option" ? [OA] : [], priceRuleIds: [] }));
    const before = db.snapshot();
    await expect(service.updateProductForStore("loja-a", PA, f)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("rejects foreign deletion IDs and price-rule relations with rollback", async () => {
    const before = db.snapshot(); const f = form();
    f.set("productConfigurationDeletes", JSON.stringify({ groupIds: [GB], optionIds: [], priceRuleIds: [] }));
    await expect(service.updateProductForStore("loja-a", PA, f)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
    const invalid = form({ availability: { mode: "ALWAYS", days: [] }, optionGroups: [group()], priceRules: [{ name: "Foreign option", priceCents: 1000, optionIds: [OB], isActive: true, sortOrder: 0 }] });
    await expect(service.updateProductForStore("loja-a", PA, invalid)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("denies settings, hours and publication in a foreign store", async () => {
    const before = db.snapshot();
    await expect(service.updateStoreForUser("loja-b", settingsForm())).rejects.toThrow();
    await expect(service.updateStoreBusinessHours("loja-b", {})).rejects.toThrow();
    await expect(service.setStorePublication("loja-b", true)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("rejects forged store IDs while allowing a legitimate own edit and product creation", async () => {
    const f = form(); f.set("storeId", B); f.set("role", "OWNER");
    await service.updateProductForStore("loja-a", PA, f);
    expect(db.rows("products").find((p: { id: string }) => p.id === PA).storeId).toBe(A);
    expect(db.rows("products").find((p: { id: string }) => p.id === PB).name).toBe("Produto B");
    const fresh = form({ availability: { mode: "ALWAYS", days: [] }, optionGroups: [group(id(40), id(41))], priceRules: [] });
    const created = await service.createProductForStore("loja-a", fresh); expect(created.storeId).toBe(A);
    expect(created.productConfiguration.optionGroups[0].id).not.toBe(id(40));
  });
  it("revalidates permission inside the transaction after a committed revocation", async () => {
    const originalName = db.rows("products")[0].name;
    db.beforeTransaction = async () => { db.beforeTransaction = null; db.rows("store_members")[0].role = "MEMBER"; };
    await expect(service.updateProductForStore("loja-a", PA, form())).rejects.toThrow();
    expect(db.rows("products")[0].name).toBe(originalName);
  });
  const writes: Array<[string, () => Promise<unknown>]> = [
    ["create product", () => service.createProductForStore("loja-a", form({ availability: { mode: "ALWAYS", days: [] }, optionGroups: [group(id(40), id(41))], priceRules: [] }))],
    ["update product", () => service.updateProductForStore("loja-a", PA, form())],
    ["delete product", () => service.deleteProductForStore("loja-a", PA)],
    ["product visibility", () => service.setProductActiveForStore("loja-a", PA, false)],
    ["create category", () => service.createCategoryForStore("loja-a", categoryForm())],
    ["update category", () => service.updateCategoryForStore("loja-a", CA, categoryForm())],
    ["delete category", () => service.deleteCategoryForStore("loja-a", CA)],
    ["settings and WhatsApp", () => service.updateStoreForUser("loja-a", settingsForm())],
    ["hours", () => service.updateStoreBusinessHours("loja-a", createDefaultBusinessHours())],
    ["publication", () => service.setStorePublication("loja-a", true)],
    ["delete image", () => images.removeProductImageForUser("loja-a", PA, id(100))],
    ["image primary", () => images.makeProductImagePrimaryForUser("loja-a", PA, id(100))],
    ["image order", () => images.reorderProductImagesForUser("loja-a", PA, [id(100)])],
    ["product blob cleanup", () => images.cleanupUnattachedProductBlob("loja-a", PA, `https://fixture.public.blob.vercel-storage.com/stores/${A}/products/${PA}/${id(101)}.png`)],
    ["appearance cleanup", () => appearance.cleanupUnattachedStoreAppearanceImage("loja-a", `https://fixture.public.blob.vercel-storage.com/stores/${A}/appearance/logo/${id(102)}.png`, "logo")]
  ];
  it.each(writes)("leaves no partial %s mutation when permission is revoked before the transaction", async (_label, write) => {
    db.rows("product_images").push({ id: id(100), productId: PA, imageUrl: "https://fixture.invalid/a.png", sortOrder: 0 });
    const expected = db.snapshot(); expected.store_members[0].role = "MEMBER";
    db.beforeTransaction = async () => { db.beforeTransaction = null; db.rows("store_members")[0].role = "MEMBER"; };
    await expect(write()).rejects.toThrow();
    expect(db.snapshot()).toEqual(expected); expect(state.blobDelete).not.toHaveBeenCalled();
  });
  it("allows valid image ordering and deletion only within the authorized product", async () => {
    db.rows("product_images").push({ id: id(100), productId: PA, imageUrl: "https://fixture.invalid/a.png", sortOrder: 0 }, { id: id(101), productId: PA, imageUrl: "https://fixture.invalid/a2.png", sortOrder: 1 });
    await images.reorderProductImagesForUser("loja-a", PA, [id(101), id(100)]);
    await images.makeProductImagePrimaryForUser("loja-a", PA, id(100));
    await images.removeProductImageForUser("loja-a", PA, id(101));
    expect(db.rows("product_images").filter((row: { productId: string }) => row.productId === PB)).toHaveLength(1);
    expect(db.rows("product_images").filter((row: { productId: string }) => row.productId === PA)).toHaveLength(1);
    expect(db.locks).toContainEqual({ table: "store_members", strength: "share" });
    expect(db.locks).toContainEqual({ table: "products", strength: "update" });
  });
  it("rolls back store settings and fees together if appearance validation fails", async () => {
    const before = db.snapshot(); const f = settingsForm();
    f.set("logoUrl", `https://fixture.public.blob.vercel-storage.com/stores/${B}/appearance/logo/${id(102)}.png`);
    await expect(service.updateStoreForUser("loja-a", f)).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("preserves legitimate settings, fees, hours, categories, publication and creation of an owned store", async () => {
    db.execute = async () => ({ rows: [{ available: true }] });
    const f = settingsForm(); f.set("deliveryEnabled", "true"); f.set("deliveryFeeType", "FIXED"); f.set("deliveryFixedFee", "7,55");
    await service.updateStoreForUser("loja-a", f);
    expect(db.rows("store_delivery_settings")[0]).toMatchObject({ storeId: A, feeType: "FIXED", fixedFeeCents: 755 });
    const schedule = createDefaultBusinessHours();
    await service.updateStoreBusinessHours("loja-a", schedule);
    expect(db.rows("store_settings")[0].openingHours).toEqual(schedule);
    const category = await service.createCategoryForStore("loja-a", categoryForm());
    await service.updateCategoryForStore("loja-a", category.id, categoryForm());
    await service.deleteCategoryForStore("loja-a", category.id);
    await service.setStorePublication("loja-a", true);
    expect((await queries.getPublicStoreBySlug("loja-a"))?.id).toBe(A);
    const store = await service.createStoreForUser({ name: "Loja C", slug: "loja-c", description: "", storefrontType: "MENU", whatsappNumber: "5511999999999", primaryColor: "#2563eb", userId: "owner-b", role: "ADMIN" });
    expect(db.rows("store_members").find((row: { storeId: string }) => row.storeId === store.id)).toMatchObject({ userId: "owner-a", role: "OWNER" });
  });
  it("never cleans up a logo that was concurrently attached again", async () => {
    const url = `https://fixture.public.blob.vercel-storage.com/stores/${A}/appearance/logo/${id(102)}.png`;
    db.rows("stores")[0].logoUrl = url;
    expect(await appearance.cleanupUnattachedStoreAppearanceImage("loja-a", url, "logo")).toBe(false);
    await appearance.deleteReplacedStoreAppearanceImages(A, { logoUrl: url, coverUrl: null }, { logoUrl: "https://fixture.invalid/new.png", coverUrl: "" });
    expect(state.blobDelete).not.toHaveBeenCalled();
  });
});

describe("roles, upload permissions and Server Actions", () => {
  it.each(["owner-a", "admin-a", "member-a"])("never grants %s authority over B", async (actor) => {
    state.actor = actor;
    await expect(requireAuthorizedStore("loja-b", "VIEW_DASHBOARD")).rejects.toThrow();
    await expect(requireStoreMembership(B, "MANAGE_PRODUCTS")).rejects.toThrow();
  });
  it("keeps store ADMIN scoped and reserves owner-only permissions", async () => {
    state.actor = "admin-a"; await expect(requireAuthorizedStore("loja-a", "MANAGE_PRODUCTS")).resolves.toBeTruthy();
    await expect(requireStoreMembership(A, "MANAGE_MEMBERS")).rejects.toThrow();
    await expect(requireStoreMembership(A, "DELETE_STORE")).rejects.toThrow();
  });
  it.each(["member-a", null])("denies administrative operations for %s", async (actor) => {
    state.actor = actor; const before = db.snapshot();
    for (const action of [() => service.createProductForStore("loja-a", form()), () => service.updateProductForStore("loja-a", PA, form()), () => service.deleteProductForStore("loja-a", PA), () => service.createCategoryForStore("loja-a", categoryForm()), () => service.deleteCategoryForStore("loja-a", CA), () => service.updateStoreForUser("loja-a", settingsForm()), () => service.updateStoreBusinessHours("loja-a", {}), () => service.setStorePublication("loja-a", true)]) await expect(action()).rejects.toThrow();
    expect(db.snapshot()).toEqual(before);
  });
  it("guards upload tokens, reads and cleanup without treating a public URL as permission", async () => {
    const payload = { storeSlug: "loja-b", productId: PB, mimeType: "image/png", size: 68 };
    await expect(images.authorizeProductImageUpload(payload, `stores/${B}/products/${PB}/${id(31)}.png`)).rejects.toMatchObject({ status: 403 });
    await expect(images.getProductImagesForUser("loja-b", PB)).rejects.toMatchObject({ status: 403 });
    await expect(images.cleanupUnattachedProductBlob("loja-a", PA, db.rows("product_images")[0].imageUrl)).rejects.toMatchObject({ status: 403 });
    await expect(appearance.authorizeStoreAppearanceUpload({ storeSlug: "loja-b", assetType: "logo", mimeType: "image/png", size: 68 }, `stores/${B}/appearance/logo/${id(32)}.png`)).rejects.toMatchObject({ status: 403 });
    expect(state.blobDelete).not.toHaveBeenCalled();
  });
  it("does not return private data or mutate B through direct Server Action calls", async () => {
    const before = db.snapshot();
    expect((await actions.updateProductAction("loja-b", PB, form())).success).toBe(false);
    expect((await actions.createProductAction("loja-b", form())).success).toBe(false);
    expect((await actions.readProductImagesAction("loja-b", PB)).images).toEqual([]);
    expect((await actions.saveStoreAppearanceAction("loja-b", settingsForm())).success).toBe(false);
    expect((await actions.saveStoreHoursAction("loja-b", {})).success).toBe(false);
    expect(db.snapshot()).toEqual(before);
  });
});

describe("real upload Route Handlers with isolated sessions and SQL fixtures", () => {
  const keys = generateKeyPairSync("ed25519");
  beforeEach(() => {
    vi.stubEnv("BLOB_STORE_ID", "fixture"); vi.stubEnv("VERCEL_OIDC_TOKEN", "fixture");
    vi.stubEnv("BLOB_WEBHOOK_PUBLIC_KEY", keys.publicKey.export({ type: "spki", format: "pem" }).toString());
    vi.stubEnv("VERCEL_BLOB_CALLBACK_URL", "https://callback.invalid");
  });
  const routes = [["product", productUploadPost], ["appearance", appearanceUploadPost]] as const;
  for (const [name, post] of routes) {
    it.each([[null, 401], ["owner-a", 403], ["member-a", 403]] as const)(`${name} token refuses actor %s with HTTP %s`, async (actor, expected) => {
      state.actor = actor; const target = actor === "member-a" ? A : B, productId = target === A ? PA : PB;
      const storeSlug = target === A ? "loja-a" : "loja-b";
      const pathname = name === "product" ? `stores/${target}/products/${productId}/${id(110)}.png` : `stores/${target}/appearance/logo/${id(110)}.png`;
      const payload = { storeSlug, productId, assetType: "logo", mimeType: "image/png", size: 68 };
      const before = db.snapshot();
      const response = await post(new Request(`http://localhost:3002/api/${name === "product" ? "products" : "stores"}/images/upload?mode=presigned`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "blob.generate-presigned-url", payload: { pathname, multipart: false, clientPayload: JSON.stringify(payload) } }) }));
      expect(response.status).toBe(expected); expect(db.snapshot()).toEqual(before);
    });
  }
  const completion = (storeId = A, productId = PA, storeSlug = "loja-a", userId = "owner-a") => {
    const pathname = `stores/${storeId}/products/${productId}/${id(111)}.png`;
    return { type: "blob.upload-completed", payload: { blob: { url: `https://fixture.public.blob.vercel-storage.com/${pathname}`, pathname, downloadUrl: "https://fixture.invalid/download", contentType: "image/png", contentDisposition: "inline", etag: '"fixture"' }, tokenPayload: JSON.stringify({ storeId, productId, storeSlug, userId, mimeType: "image/png", size: 68 }) } };
  };
  const callbackRequest = (body: unknown, signature?: string) => new Request("http://localhost:3002/api/products/images/upload?mode=presigned", { method: "POST", headers: { "content-type": "application/json", "x-vercel-signature": signature ?? sign(null, Buffer.from(JSON.stringify(body)), keys.privateKey).toString("hex") }, body: JSON.stringify(body) });
  it("refuses a signed callback whose user has no membership in the requested store", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {});
    const before = db.snapshot();
    try { expect((await productUploadPost(callbackRequest(completion(B, PB, "loja-b", "owner-a")))).status).toBe(403); expect(db.snapshot()).toEqual(before); expect(state.blobDelete).not.toHaveBeenCalled(); }
    finally { vi.restoreAllMocks(); }
  });
  it("rejects an altered callback before any persistence and accepts a valid own callback idempotently", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const valid = completion(); const signature = sign(null, Buffer.from(JSON.stringify(valid)), keys.privateKey).toString("hex");
    state.head.mockResolvedValue({ size: 68, contentType: "image/png" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))));
    state.actor = null;
    try {
      const before = db.snapshot();
      expect((await productUploadPost(callbackRequest(completion(B, PB, "loja-b", "owner-b"), signature))).status).toBe(400);
      expect(db.snapshot()).toEqual(before);
      expect((await productUploadPost(callbackRequest(valid))).status).toBe(200);
      expect((await productUploadPost(callbackRequest(valid))).status).toBe(200);
      expect(db.rows("product_images").filter((row: { productId: string }) => row.productId === PA)).toHaveLength(1);
      expect(db.rows("product_images").filter((row: { productId: string }) => row.productId === PB)).toHaveLength(1);
      expect(state.blobDelete).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); }
  });
});
