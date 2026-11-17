import { Check, Clock3, MessageCircle } from "lucide-react";
import { updateStoreAction } from "@/app/painel/actions";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requireAuthorizedStore } from "@/server/authorization";
import { getDb } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ storeSlug: string }>; searchParams: Promise<{ erro?: string; status?: string }> }) {
  const { storeSlug } = await params;
  const { store } = await requireAuthorizedStore(storeSlug, "MANAGE_SETTINGS");
  const [settings, query] = await Promise.all([getDb().select().from(storeSettings).where(eq(storeSettings.storeId, store.id)).limit(1).then(([row]) => row), searchParams]);
  const action = updateStoreAction.bind(null, storeSlug);

  return (
    <main className="dashboard-main">
      <DashboardPageHeader eyebrow="Preferências" title="Configurações" description="Defina como sua loja conversa e atende seus clientes." storeName={store.name} />
      {query.status && <p className="notice-success" role="status"><Check size={17} />Configurações salvas.</p>}
      {query.erro && <p className="auth-error" role="alert">{query.erro}</p>}
      <form action={action} className="dashboard-form dashboard-settings-form">
        <div className="dashboard-form-intro"><span><MessageCircle size={18} /></span><div><strong>Contato da loja</strong><p>Esse número será usado para receber pedidos pelo WhatsApp.</p></div></div>
        <label className="field">WhatsApp com DDI e DDD<input name="whatsappNumber" inputMode="tel" autoComplete="tel" required defaultValue={store.whatsappNumber} /></label>
        <div className="dashboard-form-divider"><span>Entrega e retirada</span></div>
        <label className="dashboard-checkbox-field"><input name="deliveryEnabled" type="checkbox" defaultChecked={settings?.deliveryEnabled} /><span><strong>Oferece entrega</strong><small>Informe aos clientes que a loja pode entregar pedidos.</small></span></label>
        <label className="dashboard-checkbox-field"><input name="pickupEnabled" type="checkbox" defaultChecked={settings?.pickupEnabled} /><span><strong>Oferece retirada</strong><small>Permita que clientes retirem o pedido com você.</small></span></label>
        <div className="dashboard-form-divider"><span>Horários de atendimento</span></div>
        <label className="field">Horários<textarea disabled placeholder="A configuração de horários estará disponível em uma próxima etapa." /><small><Clock3 size={14} /> A edição de horários ainda não está disponível.</small></label>
        <input type="hidden" name="name" value={store.name} />
        <input type="hidden" name="description" value={store.description} />
        <input type="hidden" name="storefrontType" value={store.storefrontType} />
        <input type="hidden" name="primaryColor" value={settings?.primaryColor ?? "#7351D6"} />
        <input type="hidden" name="secondaryColor" value={settings?.secondaryColor ?? "#F5F2FF"} />
        <input type="hidden" name="headline" value={settings?.headline ?? ""} />
        <input type="hidden" name="subtitle" value={settings?.subtitle ?? ""} />
        <input type="hidden" name="logoUrl" value={store.logoUrl ?? ""} />
        <input type="hidden" name="coverUrl" value={store.coverUrl ?? ""} />
        <div className="dashboard-form-actions"><button className="primary-button" type="submit">Salvar configurações</button></div>
      </form>
    </main>
  );
}
