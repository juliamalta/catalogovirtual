import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, MessageCircle, Package, Palette } from "lucide-react";
import type { getDashboardSetup } from "@/features/stores/dashboard-setup";

interface StoreSetupGuideProps {
  storeSlug: string;
  setup: ReturnType<typeof getDashboardSetup>;
  canManageProducts: boolean;
  canManageSettings: boolean;
}

export function StoreSetupGuide({ storeSlug, setup, canManageProducts, canManageSettings }: StoreSetupGuideProps) {
  const base = `/painel/${storeSlug}`;
  const steps = [
    { id: "products", title: "Adicione seus produtos", description: "Nome, preço e uma boa descrição já são um começo.", href: `${base}/produtos/novo`, action: "Adicionar produto", doneAction: "Ver produtos", doneHref: `${base}/produtos`, icon: Package, done: setup.products, allowed: canManageProducts, optional: false },
    { id: "whatsapp", title: "Confira seu WhatsApp", description: "É por esse número que seus clientes entram em contato.", href: `${base}/configuracoes#whatsapp`, action: "Configurar WhatsApp", doneAction: "Conferir número", icon: MessageCircle, done: setup.whatsapp, allowed: canManageSettings, optional: false },
    { id: "appearance", title: "Deixe a loja com a sua cara", description: "Escolha as cores e adicione sua logo ou uma capa.", href: `${base}/aparencia`, action: "Personalizar loja", doneAction: "Personalizar loja", icon: Palette, done: setup.appearance, allowed: canManageSettings, optional: true },
    { id: "hours", title: "Informe seus horários", description: "Ajude o cliente a saber quando você atende.", href: `${base}/configuracoes#horarios`, action: "Configurar horários", doneAction: "Editar horários", icon: Clock3, done: setup.hours, allowed: canManageSettings, optional: true },
  ].filter((step) => step.allowed);
  if (!steps.length) return null;
  const completed = steps.filter((step) => step.done).length;
  return <section className="admin-setup" aria-labelledby="setup-title">
    <header className="admin-section-heading"><div><h2 id="setup-title">Prepare sua loja</h2><p>Continue de onde parou. Você pode editar tudo depois.</p></div><span className="admin-setup-progress">{completed} de {steps.length} etapas configuradas</span></header>
    <ol className="admin-setup-steps">
      {steps.map(({ id, title, description, href, doneHref, action, doneAction, icon: Icon, done, optional }) =>
        <li key={id} className={done ? "is-complete" : ""}>
          <span className="admin-setup-icon" aria-hidden="true">{done ? <Check size={18} /> : <Icon size={18} />}</span>
          <div className="admin-setup-copy"><h3>{title}</h3><p>{description}</p><small>{done ? "Configurado" : optional ? "Opcional" : "Para começar"}</small></div>
          <Link href={done ? doneHref ?? href : href}>{done ? doneAction : action}<ArrowRight size={15} aria-hidden="true" /></Link>
        </li>)}
    </ol>
    <p className="admin-section-note">A logo, a capa e os horários podem ser configurados depois.</p>
  </section>;
}
