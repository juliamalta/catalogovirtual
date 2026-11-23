import "@/components/storefront/storefront.css";
import Link from "next/link";
import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { AppearanceEditor } from "@/components/dashboard/appearance-editor";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { storeBluePreset, storeSoftBlue } from "@/features/stores/store-appearance-colors";
import { requireAuthorizedStore } from "@/server/authorization";
import { getDb } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { getPublicStoreBySlug } from "@/server/queries/store.queries";
import { getBlobUploadMode } from "@/server/services/blob-configuration";
import { eq } from "drizzle-orm";
import type { StoreDemo } from "@/types/store.types";

export default async function AppearancePage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ erro?: string; status?: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_SETTINGS");
  const [settings, query, visibleStore] = await Promise.all([
    getDb().select().from(storeSettings).where(eq(storeSettings.storeId, store.id)).limit(1).then(([row]) => row),
    searchParams,
    getPublicStoreBySlug(storeSlug, true)
  ]);
  if (!visibleStore) notFound();

  const initials = store.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  const previewStore: StoreDemo = {
    slug: visibleStore.slug,
    name: visibleStore.name,
    tagline: visibleStore.tagline,
    subtitle: visibleStore.subtitle,
    description: visibleStore.description,
    type: visibleStore.type,
    whatsapp: visibleStore.whatsappNumber,
    accent: visibleStore.accent,
    background: visibleStore.background,
    logo: initials,
    logoUrl: visibleStore.logoUrl ?? undefined,
    cover: visibleStore.coverUrl ?? "",
    categories: visibleStore.categories,
    products: visibleStore.products,
    delivery: visibleStore.delivery,
    operatingStatus: visibleStore.operatingStatus
  };

  return (
    <main className="dashboard-main dashboard-appearance-main">
      <DashboardPageHeader title="Aparência" description="Personalize sua marca. Salve as alterações para atualizar a loja."
        actions={<Link className="secondary-button" href={`/${storeSlug}/preview`} target="_blank" rel="noreferrer">Prévia da loja</Link>} />
      {query.status === "salvo" && <p className="notice-success" role="status"><Check size={17} />Configurações salvas.</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
      <AppearanceEditor
        storeSlug={storeSlug}
        storeId={store.id}
        initialDraft={{
          name: store.name,
          description: store.description,
          storefrontType: store.storefrontType,
          headline: settings?.headline ?? store.name,
          subtitle: settings?.subtitle ?? "",
          primaryColor: settings?.primaryColor ?? storeBluePreset.value,
          secondaryColor: settings?.secondaryColor ?? storeSoftBlue,
          logoUrl: store.logoUrl ?? "",
          coverUrl: store.coverUrl ?? ""
        }}
        previewStore={previewStore}
        blobConfigured={getBlobUploadMode() !== null}
        blobUploadMode={getBlobUploadMode()}
        whatsappNumber={store.whatsappNumber}
        deliveryEnabled={settings?.deliveryEnabled ?? false}
        pickupEnabled={settings?.pickupEnabled ?? true}
      />
    </main>
  );
}
