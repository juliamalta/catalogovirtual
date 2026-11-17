import Link from "next/link";
import { Check, Image as ImageIcon, Package, Plus, Search, SlidersHorizontal } from "lucide-react";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { removeProductAction, toggleProductAction } from "@/app/painel/actions";
import { getStoreCategories, getStoreProducts } from "@/server/queries/store.queries";
import { requireAuthorizedStore } from "@/server/authorization";

const price = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const statusMessages: Record<string, string> = {
  "produto-criado": "Produto adicionado.",
  "produto-atualizado": "Produto atualizado.",
  "produto-excluido": "Produto excluído."
};

export default async function ProductsPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ status?: string | string[]; erro?: string | string[]; q?: string | string[]; category?: string | string[]; availability?: string | string[] }> }) {
  const { storeSlug } = await params;
  const authorized = await requireAuthorizedStore(storeSlug, "MANAGE_PRODUCTS");
  const [products, categories, query] = await Promise.all([getStoreProducts(authorized.store.id), getStoreCategories(authorized.store.id), searchParams]);
  const searchValue = Array.isArray(query.q) ? query.q[0] : query.q;
  const categoryFilter = Array.isArray(query.category) ? query.category[0] : query.category;
  const availabilityFilter = Array.isArray(query.availability) ? query.availability[0] : query.availability;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.erro) ? query.erro[0] : query.erro;
  const search = searchValue?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const filteredProducts = products.filter((product) => {
    const matchesSearch = !search || product.name.toLocaleLowerCase("pt-BR").includes(search);
    const matchesCategory = !categoryFilter || (categoryFilter === "none" ? !product.categoryId : product.categoryId === categoryFilter);
    const matchesStatus = availabilityFilter === "active" ? product.isActive : availabilityFilter === "inactive" ? !product.isActive : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const hasFilters = Boolean(search || categoryFilter || availabilityFilter);

  return (
    <main className="dashboard-main">
      <DashboardPageHeader
        eyebrow="Catálogo da loja"
        title="Produtos"
        description="Organize os itens que seus clientes podem conhecer e pedir."
        storeName={authorized.store.name}
        actions={<Link className="primary-button" href={`/painel/${storeSlug}/produtos/novo`}><Plus size={17} /> Adicionar produto</Link>}
      />
      {status && statusMessages[status] && <p className="notice-success" role="status"><Check size={17} />{statusMessages[status]}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {products.length ? <>
        <section className="dashboard-product-list-toolbar" aria-label="Buscar e filtrar produtos">
          <form method="get" className="dashboard-product-filters">
            <label className="dashboard-search-field"><Search size={17} /><span className="sr-only">Buscar produto</span><input name="q" type="search" placeholder="Buscar produto pelo nome" defaultValue={searchValue ?? ""} /></label>
            <label className="dashboard-filter-field"><span className="sr-only">Filtrar por categoria</span><select name="category" defaultValue={categoryFilter ?? ""}><option value="">Todas as categorias</option><option value="none">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="dashboard-filter-field"><span className="sr-only">Filtrar por disponibilidade</span><select name="availability" defaultValue={availabilityFilter ?? ""}><option value="">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label>
            <button className="secondary-button" type="submit"><SlidersHorizontal size={16} />Filtrar</button>
            {hasFilters && <Link className="dashboard-clear-filters" href={`/painel/${storeSlug}/produtos`}>Limpar filtros</Link>}
          </form>
          <p className="dashboard-product-result-count"><strong>{filteredProducts.length}</strong> de {products.length} {products.length === 1 ? "produto" : "produtos"}</p>
        </section>
        {filteredProducts.length ? <div className="dashboard-panel dashboard-table-wrap">
        <table className="dashboard-table">
          <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>{filteredProducts.map((product) => {
            const toggle = toggleProductAction.bind(null, storeSlug, product.id, !product.isActive);
            const remove = removeProductAction.bind(null, storeSlug, product.id);
            return <tr key={product.id}>
              <td><div className="dashboard-table-product-wrap"><span className="dashboard-product-thumbnail" role={product.imageUrl ? "img" : undefined} aria-label={product.imageUrl ? `Foto de ${product.name}` : undefined} style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}>{!product.imageUrl && <ImageIcon size={19} />}</span><span><strong className="dashboard-table-product">{product.name}</strong>{product.isFeatured && <small>Em destaque</small>}</span></div></td>
              <td>{product.categoryName ?? "Sem categoria"}</td>
              <td className="dashboard-table-price">{price(product.priceCents)}</td>
              <td><span className={`dashboard-product-status${product.isActive ? " is-active" : ""}`}><i />{product.isActive ? "Ativo" : "Inativo"}</span></td>
              <td><div className="dashboard-row-actions">
                <Link className="table-action-link" href={`/painel/${storeSlug}/produtos/${product.id}`}>Editar</Link>
                <form action={toggle}><button className="table-action-button" type="submit">{product.isActive ? "Desativar" : "Ativar"}</button></form>
                <ConfirmActionForm action={remove}><button className="table-action-button is-danger" type="submit">Excluir</button></ConfirmActionForm>
              </div></td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <DashboardEmptyState icon={Search} title="Nenhum produto corresponde a esses filtros." description="Altere os termos da busca ou limpe os filtros para ver seus produtos." action={<Link className="secondary-button" href={`/painel/${storeSlug}/produtos`}>Limpar filtros</Link>} />}
      </> : <DashboardEmptyState
        icon={Package}
        title="Sua loja está pronta para receber produtos."
        description="Adicione seu primeiro produto para começar a montar seu catálogo."
        action={<Link className="primary-button" href={`/painel/${storeSlug}/produtos/novo`}><Plus size={17} /> Adicionar produto</Link>}
      />}
    </main>
  );
}
