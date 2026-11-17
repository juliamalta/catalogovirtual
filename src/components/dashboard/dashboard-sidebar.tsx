"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutDashboard, Menu, Palette, Settings, Tags, X, Package } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

interface DashboardSidebarProps {
  storeName: string;
  profileName: string;
  storeSlug: string;
  isPublished: boolean;
}

export function DashboardSidebar({ storeName, profileName, storeSlug, isPublished }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const base = `/painel/${storeSlug}`;
  const items = [
    { href: base, label: "Visão geral", icon: LayoutDashboard },
    { href: `${base}/produtos`, label: "Produtos", icon: Package },
    { href: `${base}/categorias`, label: "Categorias", icon: Tags },
    { href: `${base}/aparencia`, label: "Aparência", icon: Palette },
    { href: `${base}/configuracoes`, label: "Configurações", icon: Settings }
  ];

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const updateViewport = () => {
      setMobileViewport(media.matches);
      if (!media.matches) setOpen(false);
    };
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => asideRef.current?.querySelector<HTMLElement>("a")?.focus());
    const handleMenuKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusable = asideRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleMenuKeys);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleMenuKeys);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return (
    <>
      <div className="dashboard-mobile-topbar">
        <Brand />
        <button ref={toggleRef} className="dashboard-mobile-toggle" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="dashboard-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <aside ref={asideRef} className={`dashboard-sidebar${open ? " is-open" : ""}`} role={open && mobileViewport ? "dialog" : undefined} aria-modal={open && mobileViewport || undefined} aria-hidden={mobileViewport && !open} inert={mobileViewport && !open} aria-label={open ? "Menu do painel" : undefined}>
        <div className="dashboard-sidebar-brand"><Brand /></div>
        <div className="dashboard-store-context">
          <span className="dashboard-store-avatar" aria-hidden="true">{storeName.trim().charAt(0).toUpperCase()}</span>
          <span className="dashboard-store-meta"><small>Loja ativa</small><strong title={storeName}>{storeName}</strong></span>
          <span className={`dashboard-status-dot${isPublished ? " is-published" : ""}`} title={isPublished ? "Publicada" : "Rascunho"} />
        </div>
        <nav id="dashboard-navigation" className="dashboard-nav" aria-label="Navegação do painel">
          <span className="dashboard-nav-label">GERENCIAR LOJA</span>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== base && pathname.startsWith(`${href}/`));
            return <Link className={`dashboard-nav-link${active ? " is-active" : ""}`} href={href} key={href} aria-current={active ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </Link>;
          })}
          <Link className="dashboard-nav-link dashboard-view-store" href={isPublished ? `/${storeSlug}` : `/${storeSlug}/preview`} target="_blank" rel="noreferrer">
            <ExternalLink size={18} strokeWidth={1.8} /><span>Visualizar loja</span>
          </Link>
        </nav>
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-profile"><span className="dashboard-profile-avatar" aria-hidden="true">{profileName.trim().charAt(0).toUpperCase()}</span><span><strong>{profileName}</strong><small>Conta administradora</small></span></div>
          <SignOutButton />
        </div>
      </aside>
      {open && <button className="dashboard-sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    </>
  );
}
