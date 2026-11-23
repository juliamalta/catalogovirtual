import React from "react";
import { ClipboardCheck, Clock3, Globe2, MessageCircle, Package, Tags } from "lucide-react";
import type { getDashboardSetup } from "@/features/stores/dashboard-setup";
import { DashboardStatCard } from "./dashboard-stat-card";

interface DashboardOverviewIndicatorsProps {
  productCount: number;
  categoryCount: number;
  isPublished: boolean;
  setup: ReturnType<typeof getDashboardSetup>;
}

export function DashboardOverviewIndicators({ productCount, categoryCount, isPublished, setup }: DashboardOverviewIndicatorsProps) {
  const steps = Object.values(setup);
  const completed = steps.filter(Boolean).length;
  return <section className="admin-overview-indicators" aria-label="Resumo da loja">
    <div className="admin-overview-indicator-grid">
      <DashboardStatCard label="Produtos cadastrados" value={productCount} icon={Package} detail="Inclui os produtos ocultos" />
      <DashboardStatCard label="Categorias" value={categoryCount} icon={Tags} detail="Organização do catálogo" />
      <DashboardStatCard label="Status da loja" value={isPublished ? "Publicada" : "Rascunho"} icon={Globe2} detail={isPublished ? "Disponível para clientes" : "Aguardando publicação"} />
      <DashboardStatCard label="Etapas configuradas" value={`${completed} de ${steps.length}`} icon={ClipboardCheck} detail="Preparação da sua loja" />
    </div>
    <div className="admin-overview-configuration" aria-label="Contato e horários">
      <span><MessageCircle size={15} aria-hidden="true" />WhatsApp: <strong>{setup.whatsapp ? "Configurado" : "Pendente"}</strong></span>
      <span><Clock3 size={15} aria-hidden="true" />Horários: <strong>{setup.hours ? "Configurado" : "Pendente"}</strong></span>
    </div>
  </section>;
}
