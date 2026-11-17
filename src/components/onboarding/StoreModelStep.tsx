import type { StorefrontType } from "@/types/store.types";
import { StoreModelCard } from "./StoreModelCard";

interface StoreModelStepProps {
  storefrontType: StorefrontType;
  primaryColor: string;
  onSelect: (value: StorefrontType) => void;
}

export function StoreModelStep({ storefrontType, primaryColor, onSelect }: StoreModelStepProps) {
  return (
    <section aria-labelledby="model-title" className="space-y-6">
      <div>
        <h2 id="model-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-[#292431] outline-none sm:text-[28px]">Como você quer apresentar seus produtos?</h2>
        <p className="mt-2 text-sm leading-6 text-[#77717f]">Escolha o formato que melhor combina com a forma como você vende.</p>
      </div>
      <div role="radiogroup" aria-labelledby="model-title" className="grid gap-3 md:grid-cols-3">
        <StoreModelCard name="storefrontType" value="MENU" selected={storefrontType === "MENU"} primaryColor={primaryColor} onSelect={onSelect} />
        <StoreModelCard name="storefrontType" value="CATALOG" selected={storefrontType === "CATALOG"} primaryColor={primaryColor} onSelect={onSelect} />
        <StoreModelCard name="storefrontType" value="SHOWCASE" selected={storefrontType === "SHOWCASE"} primaryColor={primaryColor} onSelect={onSelect} />
      </div>
    </section>
  );
}
