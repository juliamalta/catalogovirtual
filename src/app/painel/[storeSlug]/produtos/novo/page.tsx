import { ProductForm } from "@/components/dashboard/product-form";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCategories } from "@/server/queries/store.queries";
import { getProductImageUploadMode } from "@/server/services/blob-storage.service";

export default async function NewProductPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const categories = await getStoreCategories(store.id);

  return <main className="dashboard-main">
    <ProductForm storeName={store.name} storeSlug={storeSlug} storeId={store.id} blobUploadMode={getProductImageUploadMode()} categories={categories} />
  </main>;
}
