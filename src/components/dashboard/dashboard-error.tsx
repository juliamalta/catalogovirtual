"use client";

export function DashboardError({ reset, title = "Não foi possível carregar esta página" }: { reset: () => void; title?: string }) {
  return <main className="dashboard-main"><section className="admin-error" role="alert"><h1>{title}</h1><p>Tente novamente. Nenhuma alteração será enviada por esta ação.</p><button className="primary-button" type="button" onClick={reset}>Tentar novamente</button></section></main>;
}
