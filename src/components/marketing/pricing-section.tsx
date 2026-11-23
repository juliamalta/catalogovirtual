import React from "react";
import { Check } from "lucide-react";
import type { PricingSectionProps } from "./pricing-section.types";

function formatMonthlyPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(priceCents / 100);
}

export function PricingSection({ title, description, plan }: PricingSectionProps) {
  const [reais, centavos] = formatMonthlyPrice(plan.monthlyPriceCents).split(",");

  return (
    <section id="precos" className="scroll-mt-24 bg-surface px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-hover">Um preço, sem surpresa</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-secondary sm:text-lg">{description}</p>
        </header>

        <article className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pricing sm:mt-14 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="flex flex-col items-start bg-brand-soft p-6 sm:p-9 lg:p-10">
            <span className="rounded-full border border-brand-soft bg-surface px-3 py-1 text-sm font-semibold text-brand-hover">{plan.name}</span>
            <p className="mt-5 text-sm text-ink-secondary-strong">{plan.description}</p>
            <div className="mt-3 flex items-start text-ink">
              <span className="mr-2 mt-2 text-base font-semibold text-ink-secondary-strong">R$</span>
              <span className="text-6xl font-semibold leading-none tracking-[-0.065em] sm:text-7xl">{reais}</span>
              <span className="mt-1 text-2xl font-semibold tracking-tight">,{centavos}</span>
            </div>
            <span className="mt-2 text-sm text-ink-secondary-strong">por mês</span>
            <button type="button" disabled aria-disabled="true" className="mt-7 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white opacity-70">
              Assinatura em breve
            </button>
            <p className="mt-3 text-xs leading-5 text-ink-secondary-strong">A contratação estará disponível quando o checkout for lançado.</p>
          </div>

          <div className="p-6 sm:p-9 lg:p-10">
            <h3 className="text-sm font-semibold text-ink">O que está incluído</h3>
            <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2" aria-label="Recursos incluídos">
              {plan.features.map((feature) => (
                <li key={feature.label} className="flex items-start gap-3 text-sm leading-6 text-ink">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
