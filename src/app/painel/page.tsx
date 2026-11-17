import Link from "next/link";
import { ArrowRight, Plus, Store } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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

  return <div className="dashboard-root-shell">
    <header className="dashboard-root-top"><Brand /><SignOutButton /></header>
    <main className="dashboard-main dashboard-root-main">
      <DashboardPageHeader eyebrow="Suas lojas" title="Escolha uma loja" description="Acesse o painel da loja que deseja administrar." actions={<Link className="primary-button" href="/painel/nova-loja"><Plus size={17} /> Criar loja</Link>} />
      <div className="dashboard-store-grid">{stores.map((store) => <Link className="dashboard-store-choice" key={store.id} href={`/painel/${store.slug}`}>
        <span className="dashboard-store-choice-icon"><Store size={20} /></span>
        <span className="dashboard-store-choice-copy"><strong>{store.name}</strong><small>{store.status === "PUBLISHED" ? "Publicada" : "Rascunho"}</small></span>
        <ArrowRight size={18} />
      </Link>)}</div>
    </main>
  </div>;
}
