import { describe, expect, it } from "vitest";
import { hasStorePermission } from "@/features/stores/permissions";

describe("store permissions", () => {
  it("does not authorize a membership from another store", () => {
    expect(hasStorePermission({ storeId: "store-a", role: "OWNER" }, "store-b", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasStorePermission({ storeId: "store-a", role: "OWNER" }, "store-b", "MANAGE_SETTINGS")).toBe(false);
  });

  it("limits members to dashboard viewing while owners can publish", () => {
    expect(hasStorePermission({ storeId: "store-a", role: "MEMBER" }, "store-a", "VIEW_DASHBOARD")).toBe(true);
    expect(hasStorePermission({ storeId: "store-a", role: "MEMBER" }, "store-a", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasStorePermission({ storeId: "store-a", role: "OWNER" }, "store-a", "PUBLISH_STORE")).toBe(true);
  });
  it.each(["GLOBAL_ADMIN", "constructor", "__proto__"])("denies unsupported role %s instead of granting global authority", (role) => {
    expect(hasStorePermission({ storeId: "store-a", role: role as never }, "store-a", "MANAGE_MEMBERS")).toBe(false);
  });
  it("does not treat store ADMIN as platform administrator or owner", () => {
    expect(hasStorePermission({ storeId: "a", role: "ADMIN" }, "b", "VIEW_DASHBOARD")).toBe(false);
    expect(hasStorePermission({ storeId: "a", role: "ADMIN" }, "a", "MANAGE_MEMBERS")).toBe(false);
    expect(hasStorePermission({ storeId: "a", role: "ADMIN" }, "a", "DELETE_STORE")).toBe(false);
  });
});
