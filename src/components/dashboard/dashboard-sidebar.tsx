"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ExternalLink, LayoutDashboard, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { getDashboardDestinations } from "@/components/dashboard/dashboard-destinations";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import type { StoreMembershipRef } from "@/features/stores/permissions";

interface DashboardSidebarProps {
  storeName: string;
  profileName: string;
  storeSlug: string;
  isPublished: boolean;
  membership: StoreMembershipRef;
}

export function DashboardSidebar({ storeName, profileName, storeSlug, isPublished, membership }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const base = `/painel/${storeSlug}`;
  const items = [
    { href: base, label: "Visão geral", icon: LayoutDashboard },
    ...getDashboardDestinations(storeSlug, membership)
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
    const frame = window.requestAnimationFrame(() => {
      const activeLink = asideRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
      const firstLink = asideRef.current?.querySelector<HTMLElement>('a[href]');
      (activeLink ?? firstLink)?.focus();
    });
    const handleMenuKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(asideRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? []).filter((element) => element.getClientRects().length > 0);
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
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
      <aside id="dashboard-navigation" ref={asideRef} className={`dashboard-sidebar${open ? " is-open" : ""}`} role={open && mobileViewport ? "dialog" : undefined} aria-modal={open && mobileViewport || undefined} aria-hidden={mobileViewport && !open} inert={mobileViewport && !open} aria-label={open ? "Menu do painel" : undefined}>
        <div className="dashboard-sidebar-brand">
          <Brand />
          <button type="button" className="dashboard-mobile-toggle dashboard-drawer-close" aria-label="Fechar menu" onClick={() => setOpen(false)}><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="dashboard-store-context">
          <span className="dashboard-store-avatar" aria-hidden="true">{storeName.trim().charAt(0).toUpperCase()}</span>
          <span className="dashboard-store-meta"><strong title={storeName}>{storeName}</strong><small><span className={`dashboard-status-dot${isPublished ? " is-published" : ""}`} aria-hidden="true" />{isPublished ? "Publicada" : "Rascunho"}</small></span>
        </div>
        <nav className="dashboard-nav" aria-label="Navegação do painel">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== base && pathname.startsWith(`${href}/`));
            return <Link className={`dashboard-nav-link${active ? " is-active" : ""}`} href={href} key={href} aria-current={active ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
            </Link>;
          })}
          <Link className="dashboard-nav-link dashboard-view-store" href={`/${storeSlug}/preview`} target="_blank" rel="noreferrer">
            <ExternalLink size={18} strokeWidth={1.8} aria-hidden="true" /><span>Prévia da loja</span><ArrowUpRight className="dashboard-view-arrow" size={14} aria-hidden="true" />
          </Link>
        </nav>
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-profile"><span className="dashboard-profile-avatar" aria-hidden="true">{profileName.trim().charAt(0).toUpperCase()}</span><strong title={profileName}>{profileName}</strong></div>
          <SignOutButton />
        </div>
      </aside>
      {open && <button className="dashboard-sidebar-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} />}
    </>
  );
}
