import Link from "next/link";
import { Brand } from "@/components/brand";
import type { FooterProps } from "./footer.types";

export function Footer({ brandName }: FooterProps) {
  return (
    <footer className="border-t border-line bg-surface px-5 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.75fr_1fr] lg:gap-12 lg:py-12">
        <div>
          <Brand name={brandName} />
          <p className="mt-3 max-w-xs text-sm leading-6 text-ink-secondary">Um espaço online para apresentar seu negócio e seus produtos.</p>
        </div>
        <nav className="flex flex-col items-start gap-2.5 text-sm text-ink-secondary" aria-label="Explore a plataforma">
          <b className="mb-1 text-sm font-semibold text-ink">Explore</b>
          <a className="hover:text-brand" href="#formatos">Formatos</a>
          <a className="hover:text-brand" href="#como-funciona">Como funciona</a>
          <a className="hover:text-brand" href="#experiencia">A experiência</a>
          <a className="hover:text-brand" href="#precos">Preço</a>
        </nav>
        <nav className="flex flex-col items-start gap-2.5 text-sm text-ink-secondary" aria-label="Lojas demonstrativas">
          <b className="mb-1 text-sm font-semibold text-ink">Conheça as demonstrações</b>
          <Link className="hover:text-brand" href="/demonstracoes/doce-encanto">Cardápio Digital</Link>
          <Link className="hover:text-brand" href="/demonstracoes/casa-aurora">Catálogo Online</Link>
          <Link className="hover:text-brand" href="/demonstracoes/casa-viva">Vitrine Online</Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line py-4 text-[11px] text-ink-secondary sm:flex-row sm:items-center sm:justify-between">
        <span>{brandName.toUpperCase()} · SUA LOJA ONLINE, SEUS PEDIDOS NO WHATSAPP</span>
        <span>As lojas apresentadas são demonstrativas.</span>
      </div>
    </footer>
  );
}
