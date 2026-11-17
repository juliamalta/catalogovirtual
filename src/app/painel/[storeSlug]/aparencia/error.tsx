"use client";

export default function AppearanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="dashboard-main dashboard-appearance-main">
      <section className="dashboard-appearance-error" role="alert">
        <span>Não foi possível carregar o editor de aparência.</span>
        <p>Recarregue a seção. Suas alterações ainda não salvas não foram enviadas.</p>
        <button className="primary-button" type="button" onClick={() => reset()}>Tentar novamente</button>
      </section>
    </main>
  );
}
