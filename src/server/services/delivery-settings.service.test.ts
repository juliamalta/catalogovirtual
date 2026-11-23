import { beforeEach, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { storeDeliverySettings } from "@/lib/db/schema";
const mock = vi.hoisted(() => ({ authorize: vi.fn(), available: vi.fn(), transaction: vi.fn(), update: vi.fn(), where: vi.fn(), insert: vi.fn(), getDb: vi.fn(), values: [] as Array<{ table: unknown; data: Record<string, unknown> }> }));
vi.mock("@/server/authorization", () => ({ requireAuthorizedStore: mock.authorize, requireUser: vi.fn(), lockStorePermission: vi.fn() }));
vi.mock("@/server/queries/delivery.queries", () => ({ isDeliveryPersistenceAvailable: mock.available }));
vi.mock("@/lib/db", () => ({ getDb: mock.getDb }));
vi.mock("@/server/services/store-image-storage.service", () => ({ validateStoreAppearanceImageUrl: vi.fn(), deleteReplacedStoreAppearanceImages: vi.fn() }));
import { updateStoreForUser } from "./store.service";

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: "Minha loja", description: "", storefrontType: "MENU", whatsappNumber: "5511999999999", primaryColor: "#2563eb", secondaryColor: "#ffffff", deliveryEnabled: "on", pickupEnabled: "on", deliveryFeeType: "FIXED", deliveryFixedFee: "7,55" })) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks(); mock.values.length = 0;
  mock.authorize.mockResolvedValue({ user: { id: "owner" }, store: { id: "authorized-store", slug: "minha-loja", logoUrl: null, coverUrl: null } });
  mock.available.mockResolvedValue(true);
  mock.getDb.mockReturnValue({ transaction: mock.transaction });
  mock.update.mockReturnValue({ set: () => ({ where: mock.where }) });
  mock.insert.mockImplementation((table) => ({ values: (data: Record<string, unknown>) => { mock.values.push({ table, data }); return { onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) }; } }));
  mock.transaction.mockImplementation(async (callback) => callback({ update: mock.update, insert: mock.insert }));
});
it("checks store authorization before accessing delivery persistence", async () => {
  mock.authorize.mockRejectedValue(new Error("Forbidden"));
  await expect(updateStoreForUser("other-store", form())).rejects.toThrow("Forbidden");
  expect(mock.available).not.toHaveBeenCalled(); expect(mock.getDb).not.toHaveBeenCalled();
});
it("rejects a forged fee submission before any transaction while the migration is pending", async () => {
  mock.available.mockResolvedValue(false);
  await expect(updateStoreForUser("minha-loja", form())).rejects.toThrow("migração de frete está pendente");
  expect(mock.transaction).not.toHaveBeenCalled(); expect(mock.getDb).not.toHaveBeenCalled();
});
it("rejects invalid amounts without saving other store changes", async () => {
  const data = form(); data.set("deliveryFixedFee", "-3,50");
  await expect(updateStoreForUser("minha-loja", data)).rejects.toThrow();
  expect(mock.transaction).not.toHaveBeenCalled();
});
it("saves fees and settings in the same transaction using the authorized store ID", async () => {
  const data = form(); data.set("storeId", "attacker-chosen-store");
  await updateStoreForUser("minha-loja", data);
  expect(mock.authorize).toHaveBeenCalledWith("minha-loja", "MANAGE_SETTINGS");
  expect(mock.transaction).toHaveBeenCalledTimes(1);
  expect(mock.values.find(row => row.table === storeDeliverySettings)?.data).toEqual({ storeId: "authorized-store", feeType: "FIXED", fixedFeeCents: 755 });
  expect(new PgDialect().sqlToQuery(mock.where.mock.calls[0][0]).params).toEqual(["authorized-store"]);
});
it("preserves saved fees when the appearance form does not submit fee fields", async () => {
  const data = form(); data.delete("deliveryFeeType"); data.delete("deliveryFixedFee");
  await updateStoreForUser("minha-loja", data);
  expect(mock.available).not.toHaveBeenCalled();
  expect(mock.values.some(row => row.table === storeDeliverySettings)).toBe(false);
});
