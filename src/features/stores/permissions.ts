import type { StoreMemberRole } from "@/types/store.types";

export type StorePermission = "VIEW_DASHBOARD" | "MANAGE_PRODUCTS" | "MANAGE_CATEGORIES" | "MANAGE_SETTINGS" | "PUBLISH_STORE" | "MANAGE_MEMBERS" | "DELETE_STORE";
export interface StoreMembershipRef { storeId: string; role: StoreMemberRole }

const rolePermissions: Record<StoreMemberRole, ReadonlySet<StorePermission>> = {
  OWNER: new Set(["VIEW_DASHBOARD", "MANAGE_PRODUCTS", "MANAGE_CATEGORIES", "MANAGE_SETTINGS", "PUBLISH_STORE", "MANAGE_MEMBERS", "DELETE_STORE"]),
  ADMIN: new Set(["VIEW_DASHBOARD", "MANAGE_PRODUCTS", "MANAGE_CATEGORIES", "MANAGE_SETTINGS", "PUBLISH_STORE"]),
  MEMBER: new Set(["VIEW_DASHBOARD"])
};

export function hasStorePermission(membership: StoreMembershipRef | null, storeId: string, permission: StorePermission): boolean {
  return membership?.storeId === storeId && Object.prototype.hasOwnProperty.call(rolePermissions, membership.role) && rolePermissions[membership.role].has(permission);
}
