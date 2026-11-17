import { Check, GalleryVerticalEnd, LayoutGrid, Utensils } from "lucide-react";
import type { StorefrontType } from "@/types/store.types";

export const storeModels: { value: StorefrontType; title: string; description: string; Icon: typeof Utensils }[] = [
  { value: "MENU", title: "Cardápio Digital", description: "Ideal para restaurantes, cafés e delivery.", Icon: Utensils },
  { value: "CATALOG", title: "Catálogo Online", description: "Organize produtos para receber pedidos.", Icon: LayoutGrid },
  { value: "SHOWCASE", title: "Vitrine Online", description: "Apresente seus produtos e sua marca.", Icon: GalleryVerticalEnd }
];

interface StoreModelCardProps {
  name: string;
  value: StorefrontType;
  selected: boolean;
  primaryColor: string;
  onSelect: (value: StorefrontType) => void;
}

export function StoreModelCard({ name, value, selected, primaryColor, onSelect }: StoreModelCardProps) {
  const model = storeModels.find((item) => item.value === value)!;
  const Icon = model.Icon;

  return (
    <label className={`group relative block cursor-pointer rounded-2xl border p-4 transition duration-150 hover:-translate-y-0.5 hover:border-[#b9a6e8] hover:shadow-[0_8px_24px_rgba(52,38,79,0.07)] focus-within:ring-4 focus-within:ring-[#7351d6]/10 ${selected ? "border-[#8b6be0] bg-[#faf8ff] ring-1 ring-[#8b6be0]" : "border-[#e9e5ed] bg-white"}`}>
      <input className="sr-only" type="radio" name={name} value={value} checked={selected} onChange={() => onSelect(value)} aria-label={model.title} />
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-[#eee8fb] text-[#7351d6]" : "bg-[#f5f3f7] text-[#706a77] group-hover:text-[#7351d6]"}`}><Icon size={19} strokeWidth={1.8} /></span>
        <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? "border-[#7351d6] bg-[#7351d6] text-white" : "border-[#d8d3dd] text-transparent"}`}><Check size={12} strokeWidth={3} /></span>
      </div>

      <div className="mt-4">
        <h3 className="text-[15px] font-semibold text-[#332d3b]">{model.title}</h3>
        <p className="mt-1 min-h-10 text-xs leading-5 text-[#817b88]">{model.description}</p>
      </div>

      <div aria-hidden="true" className="mt-4 overflow-hidden rounded-lg border border-[#ece8ef] bg-white p-2.5">
        <div className="mb-2 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#d9d4de]" /><span className="h-1.5 w-1.5 rounded-full bg-[#d9d4de]" /><span className="h-1.5 w-1.5 rounded-full bg-[#d9d4de]" /><span className="ml-auto h-1.5 w-10 rounded-full bg-[#f0edf2]" /></div>
        <div className="flex gap-2">
          <div className="h-7 w-9 rounded-md" style={{ backgroundColor: `${primaryColor}22` }}><span className="m-1 block h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} /></div>
          <div className="flex-1 space-y-1.5 py-0.5"><div className="h-1.5 w-2/3 rounded-full bg-[#e9e5ec]" /><div className="h-1 w-1/2 rounded-full bg-[#f0edf2]" /><div className="h-1.5 w-1/4 rounded-full" style={{ backgroundColor: primaryColor }} /></div>
        </div>
      </div>
    </label>
  );
}
