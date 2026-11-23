import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardProductCatalog } from "@/components/dashboard/dashboard-product-catalog";
import { removeProductAction, toggleProductAction } from "@/app/painel/actions";
import { filterDashboardProducts } from "@/features/products/dashboard-product-filters";
import { getStoreCategories, getStoreProducts } from "@/server/queries/store.queries";
import { requireAuthorizedStore } from "@/server/authorization";

const statusMessages: Record<string, string> = {
  "produto-criado": "Produto adicionado.", "produto-atualizado": "Produto atualizado.", "produto-excluido": "Produto excluído."
};
const first = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
type ProductSearchParams = { status?: string | string[]; erro?: string | string[]; q?: string | string[]; category?: string | string[]; availability?: string | string[] };

export default async function ProductsPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<ProductSearchParams> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const [products, categories, query] = await Promise.all([getStoreProducts(store.id), getStoreCategories(store.id), searchParams]);
  const filters = { q: first(query.q), category: first(query.category), availability: first(query.availability) };
  const filtered = filterDashboardProducts(products, filters).map((product) => ({ ...product,
    onToggle: toggleProductAction.bind(null, storeSlug, product.id, !product.isActive),
    onRemove: removeProductAction.bind(null, storeSlug, product.id)
  }));
  const status = first(query.status);
  const error = first(query.erro);
  return <main className="dashboard-main admin-products-page">
    <DashboardPageHeader title="Produtos" description="Adicione, edite e escolha o que aparece na sua loja."
      actions={<Link className="primary-button" href={`/painel/${storeSlug}/produtos/novo`}><Plus size={18} aria-hidden="true" />Adicionar produto</Link>} />
    {status && statusMessages[status] && <p className="notice-success" role="status"><Check size={17} aria-hidden="true" />{statusMessages[status]}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <DashboardProductCatalog storeSlug={storeSlug} products={filtered} total={products.length} categories={categories} filters={filters} />
  </main>;
}
