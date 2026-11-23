import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreModelsProps } from "./store-models.types";

export function StoreModels({ title, description, models }: StoreModelsProps) {
  return (
    <section id="formatos" className="scroll-mt-24 bg-surface px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 grid gap-4 sm:mb-12 lg:grid-cols-[1fr_0.62fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Três jeitos de se apresentar</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">{title}</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-ink-secondary sm:text-lg">{description}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          {models.map((model, index) => index === 0 ? (
            <Link key={model.href} href={model.href} className="group relative min-h-[340px] overflow-hidden rounded-2xl bg-canvas lg:col-span-7 lg:row-span-2 lg:min-h-[520px]">
              <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${model.image})` }} role="img" aria-label={`Prévia de ${model.label.toLowerCase()}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full border border-surface/40 bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink sm:left-7 sm:top-7">{model.label}</span>
              <span className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
                <span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/75">0{index + 1} · formato</span><span className="mt-2 block text-2xl font-semibold tracking-tight sm:text-3xl">{model.title}</span><span className="mt-2 block max-w-md text-sm leading-6 text-white/85 sm:text-base">{model.description}</span></span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink transition group-hover:bg-brand group-hover:text-white"><ArrowUpRight size={19} aria-hidden="true" /></span>
              </span>
            </Link>
          ) : (
            <Link key={model.href} href={model.href} className="group flex min-h-40 items-stretch overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-brand-soft hover:shadow-lg hover:shadow-ink/5 lg:col-span-5">
              <div className="w-[36%] shrink-0 bg-cover bg-center sm:w-[40%]" style={{ backgroundImage: `url(${model.image})` }} role="img" aria-label={`Prévia de ${model.label.toLowerCase()}`} />
              <span className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                <span className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-secondary"><span>0{index + 1} · {model.label}</span><ArrowUpRight size={16} className="text-brand transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></span>
                <span><span className="block text-lg font-semibold tracking-tight text-ink sm:text-xl">{model.title}</span><span className="mt-1.5 block text-sm leading-5 text-ink-secondary">{model.description}</span></span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-sm text-ink-secondary">As lojas demonstrativas mostram possibilidades de apresentação para negócios diferentes.</p>
      </div>
    </section>
  );
}
