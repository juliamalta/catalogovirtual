import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ images: [] as Array<{ id: string; imageUrl: string; sortOrder: number }>, insert: vi.fn(), del: vi.fn(), head: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@vercel/blob", () => ({ head: state.head, del: state.del }));
vi.mock("@/lib/db", () => ({ getDb: () => {
  const db = {
    select: () => { let tableName = ""; const query = { from: (table: Record<symbol, string>) => { tableName = table[Symbol.for("drizzle:Name")]; return query; }, innerJoin: () => query, where: () => query, limit: async () => tableName === "stores" ? [{ storeId: "11111111-1111-4111-8111-111111111111", role: "OWNER" }] : tableName === "products" ? [{ id: "22222222-2222-4222-8222-222222222222", storeId: "11111111-1111-4111-8111-111111111111", name: "Fixture" }] : state.images }; return query; },
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
      select: () => { let tableName = ""; const result = () => tableName === "store_members" ? [{ storeId: "11111111-1111-4111-8111-111111111111", role: "OWNER" }] : tableName === "products" ? [{ id: "22222222-2222-4222-8222-222222222222" }] : state.images; const query = { from: (table: Record<symbol, string>) => { tableName = table[Symbol.for("drizzle:Name")]; return query; }, where: () => query, limit: () => query, for: () => query, orderBy: () => query, then: (resolve: (rows: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject) }; return query; },
      insert: () => ({ values: async (value: { imageUrl: string; sortOrder: number }) => { state.insert(value); state.images.push({ id: "33333333-3333-4333-8333-333333333333", ...value }); } }),
      update: () => ({ set: (value: { imageUrl: string }) => ({ where: async () => { state.images[0].imageUrl = value.imageUrl; } }) })
    })
  }; return db;
} }));
import { cleanupUnattachedProductBlob, persistCompletedProductImage } from "./blob-storage.service";
const storeId = "11111111-1111-4111-8111-111111111111", productId = "22222222-2222-4222-8222-222222222222";
const pathname = `stores/${storeId}/products/${productId}/44444444-4444-4444-8444-444444444444.png`;
const blob = { url: `https://fixture.public.blob.vercel-storage.com/${pathname}`, pathname, downloadUrl: "https://fixture.invalid", contentType: "image/png", contentDisposition: "inline", etag: '"fixture"' };
const payload = (replaceImageId?: string) => JSON.stringify({ userId: "fixture-user", storeSlug: "teste", storeId, productId, mimeType: "image/png", size: 68, ...(replaceImageId ? { replaceImageId } : {}) });
beforeEach(() => {
  vi.clearAllMocks(); state.images = [];
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
  state.head.mockResolvedValue({ size: 68, contentType: "image/png" });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("product callback idempotency", () => {
  it("persists repeated callbacks for the same URL as exactly one image", async () => {
    await persistCompletedProductImage(blob, payload());
    await persistCompletedProductImage(blob, payload());
    expect(state.images).toHaveLength(1); expect(state.insert).toHaveBeenCalledOnce();
    expect(state.del).not.toHaveBeenCalled();
  });
  it("accepts an already persisted callback even at the image limit", async () => {
    state.images = Array.from({ length: 5 }, (_, i) => ({ id: String(i), imageUrl: i ? `https://fixture.invalid/${i}.png` : blob.url, sortOrder: i }));
    await persistCompletedProductImage(blob, payload());
    expect(state.images).toHaveLength(5); expect(state.insert).not.toHaveBeenCalled();
  });
  it("does not delete or replace again when a replacement callback is retried", async () => {
    const id = "33333333-3333-4333-8333-333333333333";
    state.images = [{ id, imageUrl: blob.url, sortOrder: 0 }];
    await persistCompletedProductImage(blob, payload(id));
    await persistCompletedProductImage(blob, payload(id));
    expect(state.images).toEqual([{ id, imageUrl: blob.url, sortOrder: 0 }]);
    expect(state.del).not.toHaveBeenCalled(); expect(state.insert).not.toHaveBeenCalled();
  });
  it("does not report cleanup as complete when storage deletion fails", async () => {
    // Authorize this cleanup through the same session-based permission check.
    const { getCurrentSession } = await import("@/lib/auth/session");
    vi.mocked(getCurrentSession).mockResolvedValue({ user: { id: "fixture-user" } } as never);
    state.del.mockRejectedValueOnce(new Error("simulated storage outage"));
    await expect(cleanupUnattachedProductBlob("teste", productId, blob.url)).rejects.toThrow("simulated storage outage");
  });
});
