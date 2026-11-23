import React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Globe2, Plus } from "lucide-react";
import type { StorefrontType } from "@/types/store.types";
import type { getDashboardSetup } from "@/features/stores/dashboard-setup";
import { CopyStoreLinkButton } from "./copy-store-link-button";
import { DashboardPageHeader } from "./dashboard-page-header";
import { DashboardSubmitButton } from "./dashboard-submit-button";
import { StoreSetupGuide } from "./store-setup-guide";
import { DashboardOverviewIndicators } from "./dashboard-overview-indicators";

interface DashboardOverviewProps {
  store: { name: string; slug: string; storefrontType: StorefrontType };
  isPublished: boolean; publicUrl: string; setup: ReturnType<typeof getDashboardSetup>;
  canPublish: boolean; canManageProducts: boolean; canManageSettings: boolean;
  productCount: number; categoryCount: number; publicationAction: () => Promise<void>;
  message?: string; error?: string;
}
const models = { MENU: "Cardápio digital", CATALOG: "Catálogo online", SHOWCASE: "Vitrine online" };
export function DashboardOverview({ store, isPublished, publicUrl, setup, canPublish, canManageProducts, canManageSettings, productCount, categoryCount, publicationAction, message, error }: DashboardOverviewProps) {
  const base = `/painel/${store.slug}`;
  return <main className="dashboard-main admin-overview">
    <DashboardPageHeader title="Visão geral" description={`Tudo para cuidar de ${store.name}, em um só lugar.`}
      actions={canManageProducts && <Link className="primary-button" href={`${base}/produtos/novo`}><Plus size={18} aria-hidden="true" />Adicionar produto</Link>} />
    <DashboardOverviewIndicators productCount={productCount} categoryCount={categoryCount} isPublished={isPublished} setup={setup} />
    {message && <p className="notice-success" role="status"><Check size={17} aria-hidden="true" />{message}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <section className="admin-store-status" aria-labelledby="store-status-title">
      <div className="admin-store-status-heading"><span className="admin-store-icon"><Globe2 size={22} aria-hidden="true" /></span><div><span className="admin-model-label">{models[store.storefrontType]}</span><h2 id="store-status-title">{store.name}</h2></div><span className={`admin-publication-badge${isPublished ? " is-published" : ""}`}><i aria-hidden="true" />{isPublished ? "Loja publicada" : "Loja em rascunho"}</span></div>
      <p>{isPublished ? "Sua loja está disponível. Compartilhe o link com seus clientes." : "Sua loja ainda não está visível para clientes. Confira a prévia antes de publicar."}</p>
      {isPublished && <div className="admin-store-url"><code>{publicUrl}</code><CopyStoreLinkButton value={publicUrl} /></div>}
      <div className="admin-publication-actions"><Link href={`/${store.slug}/preview`} target="_blank" rel="noreferrer" className="secondary-button">Prévia da loja<ArrowUpRight size={16} aria-hidden="true" /></Link>
        {canPublish && <form action={publicationAction}><DashboardSubmitButton className={isPublished ? "admin-text-button" : "primary-button"} pendingLabel={isPublished ? "Despublicando…" : "Publicando…"}>{isPublished ? "Despublicar loja" : "Publicar loja"}</DashboardSubmitButton></form>}
        {isPublished && <Link href={`/${store.slug}`} target="_blank" rel="noreferrer" className="admin-text-link">Abrir loja publicada<ArrowUpRight size={14} aria-hidden="true" /></Link>}
      </div>
      {!canPublish && <p className="admin-section-note">A publicação é gerenciada pelo responsável pela loja.</p>}
    </section>
    <StoreSetupGuide storeSlug={store.slug} setup={setup} canManageProducts={canManageProducts} canManageSettings={canManageSettings} />
    <section className="admin-catalog-summary" aria-label="Seu catálogo"><h2>Seu catálogo</h2><p>{productCount} {productCount === 1 ? "produto cadastrado" : "produtos cadastrados"}<span aria-hidden="true"> · </span>{categoryCount} {categoryCount === 1 ? "categoria" : "categorias"}</p>{canManageProducts && <Link href={`${base}/produtos`}>Gerenciar produtos<ArrowUpRight size={15} aria-hidden="true" /></Link>}</section>
  </main>;
}
