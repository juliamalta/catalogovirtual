import { beforeEach, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
const mock = vi.hoisted(() => ({ execute: vi.fn(), select: vi.fn(), from: vi.fn(), where: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => mock }));
vi.mock("@/server/authorization", () => ({ requireStoreMembership: vi.fn() }));
import { stores } from "@/lib/db/schema";
import { getDeliverySettings } from "./delivery.queries";

beforeEach(() => {
  vi.clearAllMocks();
  mock.select.mockReturnValue({ from: mock.from });
  mock.from.mockReturnValue({ where: mock.where });
  mock.where.mockReturnValue({ limit: mock.limit });
});
it("keeps existing modalities and unknown freight before migration without querying a missing table", async () => {
  mock.execute.mockResolvedValue({ rows: [{ available: false }] });
  mock.limit.mockResolvedValueOnce([{ id: "store-a", status: "PUBLISHED" }]);
  expect(await getDeliverySettings("store-a", { deliveryEnabled: false, pickupEnabled: true })).toEqual({ persistenceAvailable: false, configuration: { deliveryEnabled: false, pickupEnabled: true, feeType: "TO_AGREE", fixedFeeCents: null } });
  expect(mock.from.mock.calls.map(([table]) => table)).toEqual([stores]);
});
it("reads each store using a store-scoped predicate and does not cache another store's fee", async () => {
  mock.execute.mockResolvedValue({ rows: [{ available: true }] });
  mock.limit.mockResolvedValueOnce([{ id: "store-a", status: "PUBLISHED" }]).mockResolvedValueOnce([{ feeType: "FIXED", fixedFeeCents: 1250 }]).mockResolvedValueOnce([{ id: "store-b", status: "PUBLISHED" }]).mockResolvedValueOnce([{ feeType: "FREE", fixedFeeCents: null }]);
  const modalities = { deliveryEnabled: true, pickupEnabled: false };
  expect((await getDeliverySettings("store-a", modalities)).configuration.fixedFeeCents).toBe(1250);
  expect((await getDeliverySettings("store-b", modalities)).configuration.feeType).toBe("FREE");
  const dialect = new PgDialect();
  expect(mock.where.mock.calls.map(([condition]) => dialect.sqlToQuery(condition).params)).toEqual([["store-a"], ["store-a"], ["store-b"], ["store-b"]]);
});
