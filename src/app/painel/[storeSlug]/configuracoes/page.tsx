import { Check, MessageCircle } from "lucide-react";
import { updateStoreAction } from "@/app/painel/actions";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSubmitButton } from "@/components/dashboard/dashboard-submit-button";
import { StoreHoursEditor } from "@/components/dashboard/StoreHoursEditor";
import { requireAuthorizedStore } from "@/server/authorization";
import { createDefaultBusinessHours, parseBusinessHoursConfiguration } from "@/lib/validations/business-hours";
import { calculateStoreOperatingStatus } from "@/server/services/business-hours.service";
import { getDb } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDeliverySettings } from "@/server/queries/delivery.queries";
import { DeliverySettingsFields } from "@/components/dashboard/delivery-settings-fields";

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ erro?: string; status?: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_SETTINGS");
  const [settings, query] = await Promise.all([getDb().select().from(storeSettings).where(eq(storeSettings.storeId, store.id)).limit(1).then(([row]) => row), searchParams]);
  const action = updateStoreAction.bind(null, storeSlug);
  const initialSchedule = parseBusinessHoursConfiguration(settings?.openingHours) ?? createDefaultBusinessHours();
  const initialStatus = calculateStoreOperatingStatus(settings?.openingHours, new Date());
  const delivery = await getDeliverySettings(store.id, { deliveryEnabled: settings?.deliveryEnabled ?? false, pickupEnabled: settings?.pickupEnabled ?? true });

  return (
    <main className="dashboard-main">
      <DashboardPageHeader title="Configurações" description="Confira o contato, as formas de atendimento e os horários da loja." />
      {query.status && <p className="notice-success" role="status"><Check size={17} />Configurações salvas.</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
      <nav className="admin-section-nav" aria-label="Seções das configurações"><a href="#whatsapp">WhatsApp</a><a href="#entrega">Entrega e retirada</a><a href="#horarios">Horários</a></nav>
      <div className="admin-settings-layout"><div className="admin-settings-content">
      <form action={action} className="dashboard-form dashboard-settings-form" aria-labelledby="contact-title">
        <div id="whatsapp" className="dashboard-form-intro"><span><MessageCircle size={18} aria-hidden="true" /></span><div><strong id="contact-title">WhatsApp da loja</strong><p>O número que seus clientes usam para entrar em contato.</p></div></div>
        <label className="field">Número com DDI e DDD<input name="whatsappNumber" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={store.whatsappNumber} aria-describedby="whatsapp-hint" /><small id="whatsapp-hint">Inclua 55, o DDD e o número. Ex.: 5511999999999.</small></label>
        <div id="entrega" className="dashboard-form-divider"><span>Entrega e retirada</span></div>
        <DeliverySettingsFields configuration={delivery.configuration} persistenceAvailable={delivery.persistenceAvailable} />
        <input type="hidden" name="name" value={store.name} />
        <input type="hidden" name="description" value={store.description} />
        <input type="hidden" name="storefrontType" value={store.storefrontType} />
        <input type="hidden" name="primaryColor" value={settings?.primaryColor ?? "#7351D6"} />
        <input type="hidden" name="secondaryColor" value={settings?.secondaryColor ?? "#F5F2FF"} />
        <input type="hidden" name="headline" value={settings?.headline ?? ""} />
        <input type="hidden" name="subtitle" value={settings?.subtitle ?? ""} />
        <input type="hidden" name="logoUrl" value={store.logoUrl ?? ""} />
        <input type="hidden" name="coverUrl" value={store.coverUrl ?? ""} />
        <div className="dashboard-form-actions"><DashboardSubmitButton>Salvar contato e atendimento</DashboardSubmitButton></div>
      </form>
      <StoreHoursEditor storeSlug={storeSlug} initialSchedule={initialSchedule} initialStatus={initialStatus} />
      </div><aside className="admin-settings-help"><h2>Onde cada ajuste aparece</h2><p><strong>WhatsApp</strong> é o contato usado no pedido do cliente.</p><p><strong>Horários</strong> informam o funcionamento da loja.</p><p>Contato e horários têm botões de salvar separados. Salve a seção que você alterou.</p></aside></div>
    </main>
  );
}
