import { notFound } from "next/navigation";
import { ConfirmActionForm } from "@/components/dashboard/confirm-action-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { updateCategoryAction, removeCategoryAction } from "@/app/painel/actions";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCategories } from "@/server/queries/store.queries";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ storeSlug: string; categoryId: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { storeSlug, categoryId } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_CATEGORIES");
  const [categories, query] = await Promise.all([getStoreCategories(store.id), searchParams]);
  const category = categories.find((item) => item.id === categoryId);
  if (!category) notFound();
  const save = updateCategoryAction.bind(null, storeSlug, categoryId);
  const remove = removeCategoryAction.bind(null, storeSlug, categoryId);

  return <main className="dashboard-main">
    <DashboardPageHeader eyebrow="Organização" title="Editar categoria" description={`Ajuste como ${category.name} aparece na sua loja.`} storeName={store.name} breadcrumb={[{ label: "Categorias", href: `/painel/${storeSlug}/categorias` }, { label: category.name }]} />
    {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
    <form action={save} className="dashboard-form">
      <label className="field">Nome<input name="name" required defaultValue={category.name} /></label>
      <label className="field">Descrição<textarea name="description" defaultValue={category.description} /></label>
      <label className="field">Ordem<input name="sortOrder" type="number" defaultValue={category.sortOrder} /></label>
      <label className="dashboard-checkbox-field"><input name="isActive" type="checkbox" defaultChecked={category.isActive} /><span><strong>Categoria ativa</strong><small>Mostre esta categoria na loja.</small></span></label>
      <div className="dashboard-form-actions"><button className="primary-button" type="submit">Salvar categoria</button></div>
    </form>
    <ConfirmActionForm action={remove}><button className="secondary-button danger-button dashboard-delete-button" type="submit">Excluir categoria</button></ConfirmActionForm>
  </main>;
}
