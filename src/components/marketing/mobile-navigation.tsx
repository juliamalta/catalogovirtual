"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavigationProps {
  loginHref?: string;
  signupHref?: string;
}

export function MobileNavigation({ loginHref = "/login", signupHref = "/cadastro" }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <button
        className="grid size-10 place-items-center rounded-lg border border-line text-ink transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 top-[72px] z-40 bg-ink/20" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-14 z-50 grid w-[min(300px,calc(100vw-32px))] gap-1 rounded-xl border border-line bg-surface p-2 shadow-xl" id="mobile-navigation" aria-label="Navegação principal">
            <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas" href="#formatos" onClick={() => setOpen(false)}>Formatos</Link>
            <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas" href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</Link>
            <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas" href="#sobre" onClick={() => setOpen(false)}>Recursos</Link>
            <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas" href="#precos" onClick={() => setOpen(false)}>Preço</Link>
            <div className="mt-1 grid gap-2 border-t border-line pt-2">
              <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-secondary" href={loginHref} onClick={() => setOpen(false)}>Entrar</Link>
              <Link className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={signupHref} onClick={() => setOpen(false)}>Criar minha loja</Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
