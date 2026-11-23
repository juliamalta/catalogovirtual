import React from "react";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import type { DashboardProductFilters } from "@/features/products/dashboard-product-filters";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardProductGrid, type DashboardProductItem } from "./dashboard-product-grid";

interface DashboardProductCatalogProps {
  storeSlug: string; products: DashboardProductItem[]; total: number;
  categories: { id: string; name: string }[]; filters: DashboardProductFilters;
}
export function DashboardProductCatalog({ storeSlug, products, total, categories, filters }: DashboardProductCatalogProps) {
  const base = `/painel/${storeSlug}/produtos`;
  const hasFilters = Boolean(filters.q || filters.category || filters.availability);
  if (!total) return <DashboardEmptyState icon={Package} title="Seu primeiro produto começa aqui"
    description="Adicione um nome e um preço. Fotos e outros detalhes podem ficar para depois."
    action={<Link className="primary-button" href={`${base}/novo`}><Plus size={17} aria-hidden="true" />Adicionar produto</Link>} />;
  return <>
    <section className="admin-product-toolbar" aria-label="Buscar e filtrar produtos">
      <form key={JSON.stringify(filters)} method="get" action={base} className="admin-product-filters">
        <label className="admin-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar produto</span><input name="q" type="search" placeholder="Buscar pelo nome" defaultValue={filters.q ?? ""} /></label>
        <label><span className="sr-only">Categoria</span><select name="category" defaultValue={filters.category ?? ""}><option value="">Todas as categorias</option><option value="none">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span className="sr-only">Visibilidade</span><select name="availability" defaultValue={filters.availability ?? ""}><option value="">Todos os status</option><option value="active">Visíveis</option><option value="inactive">Ocultos</option></select></label>
        <button className="secondary-button" type="submit">Buscar</button>
      </form>
      <div className="admin-product-results"><p aria-live="polite">{hasFilters ? `${products.length} de ${total}` : total} {total === 1 ? "produto" : "produtos"}{hasFilters ? " encontrados" : " no catálogo"}</p>{hasFilters && <Link href={base}>Limpar filtros</Link>}</div>
    </section>
    {products.length ? <DashboardProductGrid storeSlug={storeSlug} products={products} /> :
      <DashboardEmptyState icon={Search} title="Nenhum produto encontrado" description="Tente outro nome ou remova os filtros para ver todos os produtos." action={<Link className="secondary-button" href={base}>Limpar filtros</Link>} />}
  </>;
}
