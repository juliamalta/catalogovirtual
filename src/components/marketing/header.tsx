import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { MobileNavigation } from "@/components/marketing/mobile-navigation";
import type { HeaderProps } from "./header.types";

export function Header({ brandName, loginHref, signupHref }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Brand name={brandName} />
        <nav className="main-nav" aria-label="NavegaÃ§Ã£o principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#formatos">Modelos</a>
          <a href="#sobre">Recursos</a>
        </nav>
        <div className="top-actions">
          <Link className="login-link" href={loginHref}>
            Entrar
          </Link>
          <Link className="button button-dark button-small" href={signupHref}>
            Criar minha loja <ArrowRight size={15} />
          </Link>
        </div>
        <MobileNavigation loginHref={loginHref} signupHref={signupHref} />
      </div>
    </header>
  );
}

