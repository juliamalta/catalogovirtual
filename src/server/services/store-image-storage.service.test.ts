import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), limit: vi.fn(), head: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@vercel/blob", () => ({ head: mocks.head, del: mocks.del }));
vi.mock("@/lib/db", () => ({ getDb: () => {
  const select = () => {
    let tableName = "";
    const query = { from: (table: Record<symbol, string>) => { tableName = table[Symbol.for("drizzle:Name")]; return query; }, innerJoin: () => query, where: () => query, limit: () => query, for: () => query,
      then: (resolve: (rows: unknown) => unknown, reject: (error: unknown) => unknown) => (tableName === "store_members" ? Promise.resolve([{ storeId: "11111111-1111-4111-8111-111111111111", role: "OWNER" }]) : mocks.limit()).then(resolve, reject) };
    return query;
  };
  return { select, transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({ select }) };
} }));
import { authorizeStoreAppearanceUpload, cleanupUnattachedStoreAppearanceImage, isOwnedStoreAppearanceBlobUrl, validateStoreAppearanceImageUrl } from "./store-image-storage.service";

const storeId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const filename = "33333333-3333-4333-8333-333333333333.png";
const pathname = (id = storeId) => `stores/${id}/appearance/logo/${filename}`;
const url = (id = storeId) => `https://audit.public.blob.vercel-storage.com/${pathname(id)}`;
const payload = { storeSlug: "teste", assetType: "logo", mimeType: "image/png", size: 68 };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "owner" } });
  mocks.limit.mockResolvedValue([{ storeId, role: "OWNER" }]);
});

describe("appearance image authorization and tenant isolation", () => {
  it("rejects anonymous upload before querying membership", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(authorizeStoreAppearanceUpload(payload, pathname())).rejects.toMatchObject({ status: 401 });
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it.each([null, "MEMBER"])("rejects missing membership or insufficient role: %s", async (role) => {
    mocks.limit.mockResolvedValue(role ? [{ storeId, role }] : []);
    await expect(authorizeStoreAppearanceUpload(payload, pathname())).rejects.toMatchObject({ status: 403 });
  });

  it.each(["OWNER", "ADMIN"])("permits a valid image path for %s", async (role) => {
    mocks.limit.mockResolvedValue([{ storeId, role }]);
    expect((await authorizeStoreAppearanceUpload(payload, pathname())).context.storeId).toBe(storeId);
  });

  it("rejects another store's upload path and a logo in the cover namespace", async () => {
    await expect(authorizeStoreAppearanceUpload(payload, pathname(foreignId))).rejects.toMatchObject({ status: 403 });
    await expect(authorizeStoreAppearanceUpload(payload, pathname().replace('/logo/', '/cover/'))).rejects.toMatchObject({ status: 403 });
  });

  it("rejects invalid size and extension before authorizing an upload", async () => {
    await expect(authorizeStoreAppearanceUpload({ ...payload, size: 6 * 1024 * 1024 }, pathname())).rejects.toMatchObject({ status: 400 });
    await expect(authorizeStoreAppearanceUpload(payload, pathname().replace('.png', '.jpg'))).rejects.toMatchObject({ status: 403 });
  });

  it("rejects cross-store URLs before making a storage request", async () => {
    await expect(validateStoreAppearanceImageUrl(url(foreignId), storeId, "logo")).rejects.toMatchObject({ status: 403 });
    expect(mocks.head).not.toHaveBeenCalled();
    expect(isOwnedStoreAppearanceBlobUrl(url().replace('https:', 'http:'), storeId, "logo")).toBe(false);
    expect(isOwnedStoreAppearanceBlobUrl(url().replace('.com/', '.com.evil.invalid/'), storeId, "logo")).toBe(false);
  });

  it("preserves an attached image and refuses cross-store cleanup", async () => {
    mocks.limit.mockResolvedValueOnce([{ storeId, role: "OWNER" }]).mockResolvedValueOnce([{ logoUrl: url(), coverUrl: null }]);
    expect(await cleanupUnattachedStoreAppearanceImage("teste", url(), "logo")).toBe(false);
    await expect(cleanupUnattachedStoreAppearanceImage("teste", url(foreignId), "logo")).rejects.toMatchObject({ status: 403 });
    expect(mocks.del).not.toHaveBeenCalled();
  });
});
