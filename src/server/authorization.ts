import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { storeMembers, stores } from "@/lib/db/schema";
import { hasStorePermission, type StorePermission } from "@/features/stores/permissions";

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function requireStoreMembership(storeId: string, permission: StorePermission) {
  const user = await requireUser();
  const [membership] = await getDb().select({ storeId: storeMembers.storeId, role: storeMembers.role })
    .from(storeMembers)
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, user.id)))
    .limit(1);
  if (!hasStorePermission(membership ?? null, storeId, permission)) notFound();
  return { user, membership };
}

export async function requireAuthorizedStore(storeSlug: string, permission: StorePermission) {
  const user = await requireUser();
  const [result] = await getDb().select({ store: stores, storeId: storeMembers.storeId, role: storeMembers.role })
    .from(stores)
    .innerJoin(storeMembers, and(eq(storeMembers.storeId, stores.id), eq(storeMembers.userId, user.id)))
    .where(eq(stores.slug, storeSlug))
    .limit(1);
  if (!result || !hasStorePermission({ storeId: result.storeId, role: result.role }, result.store.id, permission)) notFound();
  return { user, store: result.store, role: result.role };
}
