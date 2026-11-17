export default function AppearanceLoading() {
  return (
    <main className="dashboard-main dashboard-appearance-main" aria-busy="true" aria-live="polite">
      <div className="dashboard-skeleton dashboard-appearance-loading">
        <span className="dashboard-skeleton-line is-short" />
        <span className="dashboard-skeleton-line is-title" />
        <span className="dashboard-skeleton-line" />
        <div className="dashboard-skeleton-grid"><span /><span /></div>
      </div>
      <span className="sr-only">Carregando o editor de aparência…</span>
    </main>
  );
}
