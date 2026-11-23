import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FinalCTAProps } from "./final-cta.types";

export function FinalCTA({ title, description, href, label }: FinalCTAProps) {
  return (
    <section className="px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-7xl rounded-2xl bg-brand-dark px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-soft">Sua próxima história começa aqui</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-brand-soft sm:text-lg">{description}</p>
          </div>
          <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-surface px-5 py-3 text-sm font-semibold text-brand-hover transition hover:-translate-y-0.5 hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href={href}>
            {label} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
