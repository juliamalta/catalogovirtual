import { notFound } from "next/navigation";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { ProductForm } from "@/components/dashboard/product-form";
import { removeProductAction } from "@/app/painel/actions";
import { requireAuthorizedStore } from "@/server/authorization";
import { getProductConfigurationForStore, getStoreCategories, getStoreProducts } from "@/server/queries/store.queries";
import { getProductImageUploadMode } from "@/server/services/blob-storage.service";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ storeSlug: string; productId: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { storeSlug, productId } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const [rows, categories, configuration, query] = await Promise.all([
    getStoreProducts(store.id),
    getStoreCategories(store.id),
    getProductConfigurationForStore(store.id, productId),
    searchParams
  ]);
  const product = rows.find((row) => row.id === productId);
  if (!product || !configuration) notFound();
  const remove = removeProductAction.bind(null, storeSlug, productId);

  return <main className="dashboard-main">
    {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
    <ProductForm
      storeName={store.name}
      storeSlug={storeSlug}
      storeId={store.id}
      blobUploadMode={getProductImageUploadMode()}
      categories={categories}
      initialProductType={configuration.productType}
      initialConfiguration={configuration}
      product={{ ...product, images: product.images }}
      submit="Salvar alterações"
    />
    <ConfirmActionForm action={remove}><button className="secondary-button danger-button dashboard-delete-button" type="submit">Excluir produto</button></ConfirmActionForm>
  </main>;
}
