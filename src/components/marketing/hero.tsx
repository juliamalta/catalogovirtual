import Link from "next/link";
import { ArrowDown, ArrowRight, MessageCircle, MousePointer2 } from "lucide-react";
import type { StoreDemo, StoreProduct } from "@/types/store.types";
import { formatPrice } from "@/lib/utils";
import type { HeroProps } from "./hero.types";

function HeroPreview({ store }: { store: StoreDemo }) {
  const products = store.products.slice(0, 2);

  return (
    <div className="relative mx-auto mt-12 w-full max-w-6xl sm:mt-16" aria-label={`Prévia demonstrativa da loja ${store.name}`}>
      <div className="absolute -inset-x-8 bottom-10 top-12 -z-10 rounded-[2rem] border border-brand-soft bg-brand-soft/60 sm:-inset-x-14" />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-preview sm:rounded-3xl">
        <div className="flex h-11 items-center gap-3 border-b border-line px-4 sm:h-12 sm:px-5">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="size-2 rounded-full bg-line" /><i className="size-2 rounded-full bg-line" /><i className="size-2 rounded-full bg-line" />
          </span>
          <span className="mx-auto flex items-center gap-2 rounded-md bg-canvas px-3 py-1 text-[10px] text-ink-secondary sm:text-xs">
            <span className="size-1.5 rounded-full bg-emerald-500" /> {store.slug}.catalogolojavirtual.com.br
          </span>
          <span className="text-xs tracking-widest text-ink-secondary" aria-hidden="true">•••</span>
        </div>
        <div className="relative h-36 overflow-hidden bg-line sm:h-52 lg:h-60">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${store.cover})` }} role="img" aria-label={`Capa da loja ${store.name}`} />
          <div className="absolute inset-0 bg-ink/35" />
          <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-8 sm:bottom-7">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-xs">{store.name}</span>
            <p className="mt-1 max-w-lg text-lg font-semibold leading-tight sm:text-2xl">{store.tagline}</p>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-7 sm:pb-6">
          <div className="flex items-center justify-between gap-3 border-b border-line py-4 sm:py-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-lg" aria-hidden="true">{store.logo}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink sm:text-base">{store.name}</p>
                <p className="truncate text-xs text-ink-secondary sm:text-sm">{store.tagline}</p>
              </div>
            </div>
            <span className="hidden shrink-0 rounded-full border border-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">Loja demonstrativa</span>
          </div>
          <div className="flex gap-2 overflow-hidden py-3 text-[11px] font-medium text-ink-secondary sm:gap-3 sm:py-4 sm:text-xs">
            {store.categories.slice(0, 3).map((category) => (
              <span key={category.id} className="shrink-0 rounded-full bg-canvas px-3 py-1.5">{category.name}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {products.map((product) => <PreviewProduct key={product.id} product={product} />)}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-secondary sm:mt-5 sm:pt-4 sm:text-sm">
            <MessageCircle size={15} className="shrink-0 text-brand" aria-hidden="true" />
            O cliente monta o pedido e combina os detalhes pelo WhatsApp.
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-ink-secondary sm:static sm:mt-3 sm:w-auto sm:translate-x-0 sm:flex-row sm:items-center sm:justify-center sm:text-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-sm"><MousePointer2 size={14} className="text-brand" aria-hidden="true" /> Um link para compartilhar</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-sm"><MessageCircle size={14} className="text-emerald-600" aria-hidden="true" /> Atendimento no WhatsApp</span>
      </div>
    </div>
  );
}

function PreviewProduct({ product }: { product: StoreProduct }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-24 bg-cover bg-center sm:h-36" style={{ backgroundImage: `url(${product.image})` }} role="img" aria-label={product.name} />
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3.5">
        <span className="truncate text-xs font-semibold text-ink sm:text-sm">{product.name}</span>
        <span className="shrink-0 text-xs font-semibold text-brand-hover sm:text-sm">{formatPrice(product.priceCents)}</span>
      </div>
    </div>
  );
}

export function Hero({ title, description, primaryHref, secondaryHref, sampleStore }: HeroProps) {
  return (
    <section className="overflow-hidden bg-canvas px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-surface px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-hover sm:text-xs">
            <span className="size-1.5 rounded-full bg-brand" /> Sua loja online, seus pedidos no WhatsApp
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-ink sm:mt-7 sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-ink-secondary sm:mt-6 sm:text-lg sm:leading-8">{description}</p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={primaryHref}>
              Criar minha loja <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface hover:text-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={secondaryHref}>
              Ver demonstração <ArrowDown size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <HeroPreview store={sampleStore} />
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line pt-5 text-xs font-medium text-ink-secondary sm:mt-10 sm:text-sm">
          <span>Para diferentes tipos de negócio</span><span className="hidden size-1 rounded-full bg-brand sm:block" aria-hidden="true" /><span>Com a identidade da sua marca</span><span className="hidden size-1 rounded-full bg-brand sm:block" aria-hidden="true" /><span>Link fácil de compartilhar</span>
        </div>
      </div>
    </section>
  );
}
