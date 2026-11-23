import Link from "next/link";
import { ArrowUpRight, MessageCircle, Package, ShoppingBag, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProductShowcaseProps } from "./product-showcase.types";

export function ProductShowcase({ store, href }: ProductShowcaseProps) {
  const products = store.products.slice(0, 3);
  const featuredProduct = products[0];

  return (
    <section id="experiencia" className="scroll-mt-24 overflow-hidden bg-surface px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Uma experiência que acompanha a venda</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">
            Organize no painel. Apresente com clareza.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-ink-secondary sm:text-lg">
            Cadastre seus produtos e categorias. Seu cliente navega pela loja, monta o pedido e combina os detalhes pelo WhatsApp.
          </p>
          <ul className="mt-7 space-y-5">
            <ShowcasePoint icon={<Package size={18} />} title="Produtos em ordem" description="Nome, categoria e preço reunidos em um só lugar." />
            <ShowcasePoint icon={<ShoppingBag size={18} />} title="Escolha sem complicação" description="Uma apresentação que funciona no celular e no computador." />
            <ShowcasePoint icon={<MessageCircle size={18} />} title="Conversa no canal da loja" description="O cliente segue para o WhatsApp para combinar o pedido." />
          </ul>
          <Link className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-hover transition hover:gap-3" href={href}>
            Explorar esta demonstração <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-2xl pb-2 sm:pb-5">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-showcase">
            <div className="flex h-12 items-center justify-between border-b border-line px-4 sm:px-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-7 place-items-center rounded-md bg-brand-soft text-brand"><Store size={15} aria-hidden="true" /></span>{store.name}</div>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">Demonstração</span>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-secondary">Painel da loja · demonstração</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">{store.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {store.categories.slice(0, 3).map((category) => <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-secondary" key={category.id}>{category.name}</span>)}
              </div>
              <div className="mt-4 divide-y divide-line border-y border-line">
                {products.map((product) => (
                  <div className="flex items-center gap-3 py-3" key={product.id}>
                    <span className="size-12 shrink-0 rounded-lg bg-cover bg-center sm:size-14" style={{ backgroundImage: `url(${product.image})` }} role="img" aria-label={product.name} />
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm font-semibold text-ink">{product.name}</b><small className="mt-0.5 block truncate text-xs text-ink-secondary">{product.category}</small></span>
                    <strong className="text-sm font-semibold text-ink">{formatPrice(product.priceCents)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-4 w-[min(100%,300px)] overflow-hidden rounded-[2rem] border-[5px] border-ink bg-surface shadow-xl sm:absolute sm:-bottom-3 sm:-right-5 sm:mt-0 sm:w-[210px]">
            <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-ink" />
            <div className="relative mt-2 h-24 bg-line sm:h-20">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${store.cover})` }} role="img" aria-label={`Capa de ${store.name}`} />
            </div>
            <div className="p-3 sm:p-2.5">
              <span className="text-[10px] font-semibold text-brand">{store.name}</span>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-ink sm:text-xs">{store.tagline}</p>
              {featuredProduct && <>
                <div className="mt-2 h-24 rounded-lg bg-cover bg-center sm:h-20" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={featuredProduct.name} />
                <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium text-ink">{featuredProduct.name}</span><b className="shrink-0">{formatPrice(featuredProduct.priceCents)}</b></div>
                <div className="mt-2 flex items-center justify-between rounded-md bg-brand-soft px-2 py-1.5 text-[10px] text-brand-hover"><span className="inline-flex items-center gap-1"><ShoppingBag size={11} aria-hidden="true" /> Meu pedido · 1 item</span><b>{formatPrice(featuredProduct.priceCents)}</b></div>
              </>}
              <span className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-2 py-2 text-[10px] font-semibold text-white"><MessageCircle size={12} aria-hidden="true" /> Continuar pelo WhatsApp</span>
            </div>
          </div>
          <span className="mt-3 block text-center text-[10px] font-medium uppercase tracking-[0.14em] text-ink-secondary sm:mt-3 sm:text-right">Prévia demonstrativa da plataforma</span>
        </div>
      </div>
    </section>
  );
}

function ShowcasePoint({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{icon}</span>
      <span><b className="block text-sm font-semibold text-ink">{title}</b><small className="mt-1 block max-w-md text-sm leading-5 text-ink-secondary">{description}</small></span>
    </li>
  );
}
