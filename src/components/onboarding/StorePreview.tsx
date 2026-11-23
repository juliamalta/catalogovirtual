import { ExternalLink, Store } from "lucide-react";
import type { StorefrontType } from "@/types/store.types";
import { storeModels } from "./StoreModelCard";

interface StorePreviewProps {
  name: string;
  slug: string;
  description: string;
  storefrontType: StorefrontType;
  primaryColor: string;
}

export function StorePreview({ name, slug, description, storefrontType, primaryColor }: StorePreviewProps) {
  const modelName = storeModels.find((model) => model.value === storefrontType)?.title ?? "Catálogo Online";
  const publicUrl = slug ? `catalogolojavirtual.com.br/${slug}` : "catalogolojavirtual.com.br/seu-endereco";

  return (
    <aside aria-label="Prévia da identidade da loja" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-secondary"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand"><Store size={15} /></span>Prévia da loja</div>
        <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-medium text-ink-secondary">{modelName}</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <div className="h-2" style={{ backgroundColor: primaryColor }} />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>{name.trim() ? name.trim().charAt(0).toUpperCase() : <Store size={17} />}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{name.trim() || "Nome da sua loja"}</p>
              <p className="mt-0.5 truncate text-xs text-ink-secondary">{publicUrl}</p>
            </div>
          </div>
          <p className="mt-4 min-h-5 text-xs leading-5 text-ink-secondary">{description.trim() || "A descrição da sua loja aparecerá aqui."}</p>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[11px] text-ink-secondary">Identidade da sua loja</span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: primaryColor }}>Ver loja <ExternalLink size={12} /></span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-secondary">Prévia com os dados que você informou. Você poderá ajustar a aparência depois.</p>
    </aside>
  );
}
