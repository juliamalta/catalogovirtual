import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/marketing/mobile-navigation";
import type { HeaderProps } from "./header.types";

export function Header({ brandName, loginHref, signupHref }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 px-5 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 sm:gap-8 [&_.brand]:text-lg sm:[&_.brand]:text-2xl">
        <Brand name={brandName} />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-secondary lg:flex" aria-label="Navegação principal">
          <a className="transition-colors hover:text-brand" href="#como-funciona">Como funciona</a>
          <a className="transition-colors hover:text-brand" href="#formatos">Modelos</a>
          <a className="transition-colors hover:text-brand" href="#sobre">Recursos</a>
          <a className="transition-colors hover:text-brand" href="#precos">Preço</a>
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <Link className="text-sm font-semibold text-ink-secondary transition-colors hover:text-brand" href={loginHref}>
            Entrar
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={signupHref}>
            Criar minha loja <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <MobileNavigation loginHref={loginHref} signupHref={signupHref} />
      </div>
    </header>
  );
}
