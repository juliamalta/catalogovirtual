import { notFound } from "next/navigation";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { removeProductAction } from "@/app/painel/actions";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCategories, getStoreProducts } from "@/server/queries/store.queries";
import { isBlobStorageConfigured } from "@/server/services/blob-storage.service";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ storeSlug: string; productId: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { storeSlug, productId } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const [rows, categories, query] = await Promise.all([getStoreProducts(store.id), getStoreCategories(store.id), searchParams]);
  const product = rows.find((row) => row.id === productId);
  if (!product) notFound();
  const remove = removeProductAction.bind(null, storeSlug, productId);

  return <main className="dashboard-main">
    <DashboardPageHeader eyebrow="Catálogo da loja" title="Editar produto" description={`Atualize as informações de ${product.name}.`} storeName={store.name} breadcrumb={[{ label: "Produtos", href: `/painel/${storeSlug}/produtos` }, { label: product.name }]} />
    {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
    <ProductForm
      storeSlug={storeSlug}
      storeId={store.id}
      blobConfigured={isBlobStorageConfigured()}
      categories={categories}
      product={{ ...product, images: product.images }}
      submit="Salvar alterações"
    />
    <ConfirmActionForm action={remove}><button className="secondary-button danger-button dashboard-delete-button" type="submit">Excluir produto</button></ConfirmActionForm>
  </main>;
}
