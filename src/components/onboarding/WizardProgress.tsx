const steps = ["Identidade", "Modelo", "Contato e aparência"];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <nav aria-label="Etapas de criação da loja" className="mb-8">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((label, index) => {
          const step = index + 1;
          const complete = step < currentStep;
          const active = step === currentStep;

          return (
            <li key={label} aria-current={active ? "step" : undefined} className="min-w-0">
              <div className={`mb-2 h-1 rounded-full ${step <= currentStep ? "bg-brand" : "bg-line"}`} />
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${complete || active ? "bg-brand text-white" : "bg-canvas text-ink-secondary"}`}>
                  {complete ? "✓" : step}
                </span>
                <span className={active ? "truncate font-semibold text-ink" : "hidden truncate text-ink-secondary sm:block"}>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
