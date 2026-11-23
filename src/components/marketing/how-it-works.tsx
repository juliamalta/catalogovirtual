import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HowItWorksProps } from "./how-it-works.types";

export function HowItWorks({ title, description, actionHref, steps }: HowItWorksProps) {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-canvas px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Do seu produto ao seu cliente</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">{title}</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-secondary">{description}</p>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-hover transition hover:gap-3" href={actionHref}>Começar minha loja <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <ol className="grid border-t border-line sm:grid-cols-2">
            {steps.map((step, index) => (
              <li className={`relative border-b border-line py-5 sm:py-6 ${index % 2 === 0 ? "sm:pr-7" : "sm:pl-7"}`} key={step.number}>
                <span className="text-sm font-semibold tabular-nums text-brand">{step.number}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink sm:text-xl">{step.title}</h3>
                <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-secondary sm:text-base">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
