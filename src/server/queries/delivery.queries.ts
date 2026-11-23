import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { storeDeliverySettings, stores } from "@/lib/db/schema";
import type { DeliveryConfiguration } from "@/features/cart/checkout";
import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/server/authorization";

export async function isDeliveryPersistenceAvailable() {
  const result = await getDb().execute<{ available: boolean }>(sql`select to_regclass('public.store_delivery_settings') is not null as available`);
  return result.rows[0]?.available === true;
}

export async function getDeliverySettings(storeId: string, modalities: Pick<DeliveryConfiguration, "deliveryEnabled" | "pickupEnabled">) {
  const [store] = await getDb().select({ id: stores.id, status: stores.status }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) notFound();
  // Published freight is public; draft-store settings require membership even
  // when this shared query is called outside the dashboard/preview routes.
  if (store.status !== "PUBLISHED") await requireStoreMembership(storeId, "VIEW_DASHBOARD");
  const persistenceAvailable = await isDeliveryPersistenceAvailable();
  const [saved] = persistenceAvailable ? await getDb().select().from(storeDeliverySettings).where(eq(storeDeliverySettings.storeId, storeId)).limit(1) : [];
  return {
    persistenceAvailable,
    configuration: { ...modalities, feeType: saved?.feeType ?? "TO_AGREE", fixedFeeCents: saved?.fixedFeeCents ?? null } satisfies DeliveryConfiguration,
  };
}
