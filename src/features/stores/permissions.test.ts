import { describe, expect, it } from "vitest";
import { hasStorePermission } from "@/features/stores/permissions";

describe("store permissions", () => {
  it("does not authorize a membership from another store", () => {
    expect(hasStorePermission({ storeId: "store-a", role: "OWNER" }, "store-b", "MANAGE_PRODUCTS")).toBe(false);
  });

  it("limits members to dashboard viewing while owners can publish", () => {
    expect(hasStorePermission({ storeId: "store-a", role: "MEMBER" }, "store-a", "VIEW_DASHBOARD")).toBe(true);
    expect(hasStorePermission({ storeId: "store-a", role: "MEMBER" }, "store-a", "MANAGE_PRODUCTS")).toBe(false);
    expect(hasStorePermission({ storeId: "store-a", role: "OWNER" }, "store-a", "PUBLISH_STORE")).toBe(true);
  });
});
