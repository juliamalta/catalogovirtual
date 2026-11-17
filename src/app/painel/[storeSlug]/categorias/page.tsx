import Link from "next/link";
import { Check, FolderPlus, Plus, Tags } from "lucide-react";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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
      <DashboardPageHeader eyebrow="Organização" title="Categorias" description="Agrupe seus produtos para deixar a loja mais simples de explorar." storeName={authorized.store.name} />
      {query.status && statusMessages[query.status] && <p className="notice-success" role="status"><Check size={17} />{statusMessages[query.status]}</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
      <form action={add} className="dashboard-inline-create">
        <label className="sr-only" htmlFor="new-category">Nova categoria</label>
        <input id="new-category" name="name" required minLength={2} maxLength={80} placeholder="Nome da nova categoria" />
        <button className="primary-button" type="submit"><Plus size={17} /> Adicionar categoria</button>
      </form>
      {categories.length ? <div className="dashboard-panel dashboard-category-list">
        {categories.map((category) => {
          const remove = removeCategoryAction.bind(null, storeSlug, category.id);
          return <article className="dashboard-category-row" key={category.id}>
            <span className="dashboard-category-icon"><Tags size={18} /></span>
            <div className="dashboard-category-info"><strong>{category.name}</strong><p>{category.description || "Sem descrição"}</p></div>
            <span className={`dashboard-category-status${category.isActive ? " is-active" : ""}`}>{category.isActive ? "Ativa" : "Inativa"}</span>
            <div className="dashboard-row-actions"><Link className="table-action-link" href={`/painel/${storeSlug}/categorias/${category.id}`}>Editar</Link><ConfirmActionForm action={remove}><button className="table-action-button is-danger" type="submit">Excluir</button></ConfirmActionForm></div>
          </article>;
        })}
      </div> : <DashboardEmptyState icon={FolderPlus} title="Organize sua loja por categorias." description="Crie categorias como novidades, sobremesas ou acessórios para facilitar a navegação." />}
    </main>
  );
}
