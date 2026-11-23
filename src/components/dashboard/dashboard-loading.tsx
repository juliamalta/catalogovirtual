import React from "react";

export function DashboardLoading({ label = "Carregando o painel…" }: { label?: string }) {
  return <main className="dashboard-main" aria-busy="true"><p role="status" className="sr-only">{label}</p><div className="admin-loading" aria-hidden="true"><span /><span /><div /></div></main>;
}
