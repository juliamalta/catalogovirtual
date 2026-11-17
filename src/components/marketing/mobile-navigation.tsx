"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavigationProps {
  loginHref?: string;
  signupHref?: string;
}

export function MobileNavigation({
  loginHref = "/login",
  signupHref = "/cadastro",
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav-wrap">
      <button
        className="mobile-menu"
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && (
        <>
          <button className="mobile-nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <nav className="mobile-nav-panel" id="mobile-navigation" aria-label="Navegação principal">
            <Link href="#formatos" onClick={() => setOpen(false)}>Formatos</Link>
            <Link href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</Link>
            <Link href="#sobre" onClick={() => setOpen(false)}>Sobre</Link>
            <div className="mobile-nav-actions">
              <Link href={loginHref} onClick={() => setOpen(false)}>Entrar</Link>
              <Link className="button button-purple" href={signupHref} onClick={() => setOpen(false)}>Criar minha loja</Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
