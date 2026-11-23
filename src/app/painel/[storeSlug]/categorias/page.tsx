import Link from "next/link";
import { Check, FolderPlus, Plus, Tags } from "lucide-react";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSubmitButton } from "@/components/dashboard/dashboard-submit-button";
import { createCategoryAction, removeCategoryAction } from "@/app/painel/actions";
import { getStoreCategories } from "@/server/queries/store.queries";
import { requireAuthorizedStore } from "@/server/authorization";

const statusMessages: Record<string, string> = {
  "categoria-criada": "Categoria adicionada.",
  "categoria-atualizada": "Categoria atualizada.",
  "categoria-excluida": "Categoria excluída."
};

export default async function CategoriesPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ status?: string; erro?: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_CATEGORIES");
  const [categories, query] = await Promise.all([getStoreCategories(store.id), searchParams]);
  const add = createCategoryAction.bind(null, storeSlug);

  return (
    <main className="dashboard-main">
      <DashboardPageHeader title="Categorias" description="Agrupe seus produtos para facilitar a escolha dos clientes." />
      {query.status && statusMessages[query.status] && <p className="notice-success" role="status"><Check size={17} />{statusMessages[query.status]}</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
      <form action={add} className="dashboard-inline-create">
        <label className="admin-category-field" htmlFor="new-category">Nome da categoria<input id="new-category" name="name" required minLength={2} maxLength={80} placeholder="Ex.: Doces, bebidas ou novidades" /></label>
        <DashboardSubmitButton pendingLabel="Adicionando…"><Plus size={17} aria-hidden="true" />Adicionar categoria</DashboardSubmitButton>
      </form>
      {categories.length ? <div className="dashboard-panel dashboard-category-list">
        {categories.map((category) => {
          const remove = removeCategoryAction.bind(null, storeSlug, category.id);
          return <article className="dashboard-category-row" key={category.id}>
            <span className="dashboard-category-icon"><Tags size={18} /></span>
            <div className="dashboard-category-info"><strong>{category.name}</strong>{category.description && <p>{category.description}</p>}</div>
            <span className={`dashboard-category-status${category.isActive ? " is-active" : ""}`}>{category.isActive ? "Visível" : "Oculta"}</span>
            <div className="dashboard-row-actions"><Link className="table-action-link" aria-label={`Editar categoria ${category.name}`} href={`/painel/${storeSlug}/categorias/${category.id}`}>Editar</Link><ConfirmActionForm action={remove} message={`Excluir a categoria “${category.name}”? Os produtos não serão excluídos.`}><DashboardSubmitButton className="table-action-button is-danger" pendingLabel="Excluindo…">Excluir</DashboardSubmitButton></ConfirmActionForm></div>
          </article>;
        })}
      </div> : <DashboardEmptyState icon={FolderPlus} title="Organize sua loja por categorias." description="Crie categorias como novidades, sobremesas ou acessórios para facilitar a navegação." />}
    </main>
  );
}
