import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireAuthorizedStore } from "@/server/authorization";

export const dynamic = "force-dynamic";

export default async function StoreDashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const authorized = await requireAuthorizedStore(storeSlug, "VIEW_DASHBOARD");
  const { store } = authorized;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar storeName={store.name} profileName={authorized.user.name} storeSlug={store.slug} isPublished={store.status === "PUBLISHED"} />
      {children}
    </div>
  );
}
