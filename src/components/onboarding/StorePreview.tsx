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
    <aside aria-label="Prévia da identidade da loja" className="rounded-2xl border border-[#ebe7ef] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b8492]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f5f2f8] text-[#7351d6]"><Store size={15} /></span>Prévia da loja</div>
        <span className="rounded-full bg-[#f6f4f8] px-2.5 py-1 text-[10px] font-medium text-[#77717f]">{modelName}</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#eeeaf1]">
        <div className="h-2" style={{ backgroundColor: primaryColor }} />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>{name.trim() ? name.trim().charAt(0).toUpperCase() : <Store size={17} />}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#332d3b]">{name.trim() || "Nome da sua loja"}</p>
              <p className="mt-0.5 truncate text-xs text-[#8b8492]">{publicUrl}</p>
            </div>
          </div>
          <p className="mt-4 min-h-5 text-xs leading-5 text-[#77717f]">{description.trim() || "A descrição da sua loja aparecerá aqui."}</p>
          <div className="mt-4 flex items-center justify-between border-t border-[#f0edf2] pt-3">
            <span className="text-[11px] text-[#817b88]">Identidade da sua loja</span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: primaryColor }}>Ver loja <ExternalLink size={12} /></span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#96909c]">Prévia com os dados que você informou. Você poderá ajustar a aparência depois.</p>
    </aside>
  );
}
