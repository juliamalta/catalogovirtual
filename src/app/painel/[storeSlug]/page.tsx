import { eq } from "drizzle-orm";
import { toggleStorePublicationAction } from "@/app/painel/actions";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardSetup } from "@/features/stores/dashboard-setup";
import { hasStorePermission } from "@/features/stores/permissions";
import { getDb } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCategories, getStoreProducts } from "@/server/queries/store.queries";

const publicationMessages = new Map([["publicada", "Loja publicada. Compartilhe seu link com os clientes."], ["despublicada", "Loja em rascunho. Você pode publicar novamente quando quiser."]]);
export default async function StoreDashboardPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ status?: string; erro?: string }> }) {
  const { storeSlug } = await params;
  const [{ store, role }, query] = await Promise.all([requireAuthorizedStore(storeSlug, "VIEW_DASHBOARD"), searchParams]);
  const membership = { storeId: store.id, role };
  const [products, categories, [settings]] = await Promise.all([
    getStoreProducts(store.id), getStoreCategories(store.id),
    getDb().select().from(storeSettings).where(eq(storeSettings.storeId, store.id)).limit(1)
  ]);
  const isPublished = store.status === "PUBLISHED";
  const publicUrl = `${(process.env.BETTER_AUTH_URL || "http://localhost:3002").replace(/\/+$/, "")}/${store.slug}`;
  return <DashboardOverview store={store} isPublished={isPublished} publicUrl={publicUrl}
    setup={getDashboardSetup({ activeProductCount: products.filter((product) => product.isActive).length,
      logoUrl: store.logoUrl, coverUrl: store.coverUrl, whatsappNumber: store.whatsappNumber, openingHours: settings?.openingHours })}
    canPublish={hasStorePermission(membership, store.id, "PUBLISH_STORE")}
    canManageProducts={hasStorePermission(membership, store.id, "MANAGE_PRODUCTS")}
    canManageSettings={hasStorePermission(membership, store.id, "MANAGE_SETTINGS")}
    productCount={products.length} categoryCount={categories.length}
    publicationAction={toggleStorePublicationAction.bind(null, storeSlug, !isPublished)}
    message={publicationMessages.get(query.status ?? "")} error={query.erro} />;
}
