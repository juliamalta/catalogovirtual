import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireAuthorizedStore } from "@/server/authorization";
import "./store-dashboard.css";

export const dynamic = "force-dynamic";

export default async function StoreDashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const authorized = await requireAuthorizedStore(storeSlug, "VIEW_DASHBOARD");
  const { store } = authorized;

  return (
    <div className="dashboard-shell store-dashboard-shell">
      <a className="admin-skip-link" href="#painel-conteudo">Ir para o conteúdo</a>
      <DashboardSidebar storeName={store.name} profileName={authorized.user.name} storeSlug={store.slug} isPublished={store.status === "PUBLISHED"} membership={{ storeId: store.id, role: authorized.role }} />
      <div id="painel-conteudo" className="admin-content" tabIndex={-1}>{children}</div>
    </div>
  );
}
