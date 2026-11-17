import Link from "next/link";
import { ArrowUpRight, Check, ClipboardList, ExternalLink, LayoutTemplate, MessageCircle, Package, Tags } from "lucide-react";
import { toggleStorePublicationAction } from "@/app/painel/actions";
import { CopyStoreLinkButton } from "@/components/dashboard/copy-store-link-button";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { hasStorePermission } from "@/features/stores/permissions";
import { requireAuthorizedStore } from "@/server/authorization";
import { getStoreCounts } from "@/server/queries/store.queries";

const modelName = { MENU: "Cardápio Digital", CATALOG: "Catálogo Online", SHOWCASE: "Vitrine Online" };

export default async function StoreDashboardPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ status?: string; erro?: string }> }) {
  const { storeSlug } = await params;
  const [authorized, query] = await Promise.all([requireAuthorizedStore(storeSlug, "VIEW_DASHBOARD"), searchParams]);
  const { store } = authorized;
  const canPublish = hasStorePermission({ storeId: store.id, role: authorized.role }, store.id, "PUBLISH_STORE");
  const counts = await getStoreCounts(store.id);
  const isPublished = store.status === "PUBLISHED";
  const toggle = toggleStorePublicationAction.bind(null, storeSlug, !isPublished);
  const messages: Record<string, string> = { publicada: "Loja publicada.", despublicada: "Loja despublicada." };
  const baseUrl = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  const publicUrl = `${baseUrl}/${store.slug}`;
  const previewPath = isPublished ? `/${store.slug}` : `/${store.slug}/preview`;

  return (
    <main className="dashboard-main">
      <DashboardPageHeader
        eyebrow="Visão geral"
        title={`Olá, ${store.name}`}
        description="Acompanhe e organize o conteúdo da sua loja."
        storeName={store.name}
        actions={<Link className="primary-button" href={`/painel/${storeSlug}/produtos/novo`}><Package size={17} /> Adicionar produto</Link>}
      />
      {query.status && messages[query.status] && <p className="notice-success" role="status"><Check size={17} />{messages[query.status]}</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}

      <section className="dashboard-stats" aria-label="Resumo da loja">
        <DashboardStatCard label="Produtos cadastrados" value={counts.products} detail="Itens no seu catálogo" icon={Package} />
        <DashboardStatCard label="Categorias" value={counts.categories} detail="Formas de organizar seus itens" icon={Tags} tone="neutral" />
        <DashboardStatCard label="Modelo da loja" value={modelName[store.storefrontType]} detail="Você pode alterar em Aparência" icon={LayoutTemplate} tone="neutral" />
        <DashboardStatCard label="Publicação" value={isPublished ? "Publicada" : "Rascunho"} detail={isPublished ? "Sua loja está no ar" : "Visível apenas para você"} icon={isPublished ? Check : ClipboardList} tone={isPublished ? "green" : "purple"} />
      </section>

      <section className="dashboard-store-card">
        <div className="dashboard-store-card-heading">
          <span className="dashboard-store-card-icon"><ExternalLink size={19} /></span>
          <div><p className="dashboard-eyebrow">SUA LOJA ONLINE</p><h2>Compartilhe seu catálogo</h2></div>
          <span className={`dashboard-publication-pill${isPublished ? " is-published" : ""}`}><i />{isPublished ? "Publicada" : "Rascunho"}</span>
        </div>
        <p className="dashboard-store-card-copy">{isPublished ? "Envie o link para seus clientes e receba pedidos pelo WhatsApp." : "Confira a prévia, organize seus produtos e publique quando estiver tudo pronto."}</p>
        <div className="dashboard-public-link"><span className="dashboard-link-label">Link da loja</span><code>{publicUrl}</code></div>
        <div className="dashboard-store-actions">
          <CopyStoreLinkButton value={publicUrl} />
          <Link className="secondary-button" href={previewPath} target="_blank" rel="noreferrer"><ExternalLink size={16} />{isPublished ? "Visualizar loja" : "Pré-visualizar"}<ArrowUpRight size={14} /></Link>
          {canPublish && <form action={toggle}><button className={isPublished ? "secondary-button" : "primary-button"} type="submit">{isPublished ? "Despublicar loja" : "Publicar loja"}</button></form>}
        </div>
        {!isPublished && <p className="dashboard-domain-note">O domínio catalogolojavirtual.com.br será ativado após a configuração do domínio.</p>}
      </section>

      <section className="dashboard-quick-actions" aria-labelledby="dashboard-quick-actions-title">
        <div><p className="dashboard-eyebrow">PRÓXIMOS PASSOS</p><h2 id="dashboard-quick-actions-title">Continue organizando sua loja</h2></div>
        <div className="dashboard-quick-action-grid">
          <Link href={`/painel/${storeSlug}/produtos`}><span><Package size={18} /></span><strong>Gerenciar produtos</strong><small>{counts.products} cadastrados</small><ArrowUpRight size={16} /></Link>
          <Link href={`/painel/${storeSlug}/categorias`}><span><Tags size={18} /></span><strong>Organizar categorias</strong><small>{counts.categories} cadastradas</small><ArrowUpRight size={16} /></Link>
          <Link href={`/painel/${storeSlug}/aparencia`}><span><LayoutTemplate size={18} /></span><strong>Personalizar aparência</strong><small>Modelo, cores e identidade</small><ArrowUpRight size={16} /></Link>
          <Link href={`/painel/${storeSlug}/configuracoes`}><span><MessageCircle size={18} /></span><strong>Configurar atendimento</strong><small>WhatsApp e formas de entrega</small><ArrowUpRight size={16} /></Link>
        </div>
      </section>

      {counts.products === 0 && <DashboardEmptyState
        icon={Package}
        title="Sua loja está pronta para receber produtos."
        description="Adicione seu primeiro produto para começar a montar seu catálogo."
        action={<Link className="primary-button" href={`/painel/${storeSlug}/produtos/novo`}><Package size={17} /> Adicionar produto</Link>}
      />}
    </main>
  );
}
