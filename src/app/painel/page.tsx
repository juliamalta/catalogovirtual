import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { getCurrentSession } from "@/lib/auth/session";
import { getStoresForUser } from "@/server/queries/store.queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const stores = await getStoresForUser(session.user.id);
  if (stores.length === 1) redirect(`/painel/${stores[0].slug}`);
  if (!stores.length) redirect("/painel/nova-loja");

  return <div className="dashboard-root-shell !font-marketing">
    <header className="dashboard-root-top"><Brand /><SignOutButton /></header>
    <main className="dashboard-main dashboard-root-main">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bold tracking-tight text-ink">Suas lojas</h1>
        <Link className="primary-button" href="/painel/nova-loja"><Plus size={17} aria-hidden="true" /> Criar loja</Link>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => {
          const isPublished = store.status === "PUBLISHED";
          return <li key={store.id} className="min-w-0">
            <Link className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5" href={`/painel/${store.slug}`}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft font-bold text-brand-dark" aria-hidden="true">{store.name.trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <strong className="block break-words font-semibold text-ink">{store.name}</strong>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-secondary"><span className={`size-1.5 rounded-full ${isPublished ? "bg-success" : "bg-brand"}`} aria-hidden="true" />{isPublished ? "Publicada" : "Rascunho"}</span>
              </span>
              <ArrowRight className="shrink-0 text-brand-dark" size={18} aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </main>
  </div>;
}
