import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCategories } from "@/server/queries/store.queries";
import { isBlobStorageConfigured } from "@/server/services/blob-storage.service";

export default async function NewProductPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const categories = await getStoreCategories(store.id);

  return <main className="dashboard-main">
    <DashboardPageHeader eyebrow="Catálogo da loja" title="Adicionar produto" description="Inclua os detalhes que ajudam seus clientes a escolher." storeName={store.name} breadcrumb={[{ label: "Produtos", href: `/painel/${storeSlug}/produtos` }, { label: "Novo produto"}]} />
    <ProductForm storeSlug={storeSlug} storeId={store.id} blobConfigured={isBlobStorageConfigured()} categories={categories} />
  </main>;
}
