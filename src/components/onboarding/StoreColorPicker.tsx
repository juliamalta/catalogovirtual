import { Check, Pipette } from "lucide-react";
import { storeBluePreset, storeDarkBluePreset } from "@/features/stores/store-appearance-colors";

export const storeColorOptions = [
  storeBluePreset,
  storeDarkBluePreset,
  { name: "Verde", value: "#16866A" },
  { name: "Rosa", value: "#D14E82" },
  { name: "Terracota", value: "#C45D3A" },
  { name: "Grafite", value: "#45404D" }
];

interface StoreColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function StoreColorPicker({ value, onChange }: StoreColorPickerProps) {
  const normalized = value.toUpperCase();
  const isPreset = storeColorOptions.some((option) => option.value === normalized);

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Cor principal</legend>
      <p className="mt-1 text-xs text-ink-secondary">Ela será usada nos destaques da sua loja.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {storeColorOptions.map((option) => {
          const selected = normalized === option.value;
          return (
            <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-label={`${option.name}${selected ? ", selecionada" : ""}`} aria-pressed={selected} title={option.name} className={`grid h-10 w-10 place-items-center rounded-full border-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${selected ? "border-ink" : "border-transparent"}`}>
              <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ backgroundColor: option.value }}>{selected && <Check size={15} strokeWidth={3} />}</span>
            </button>
          );
        })}
        <label className={`relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full border-2 bg-surface text-ink-secondary transition hover:border-brand-soft focus-within:ring-4 focus-within:ring-brand/20 ${!isPreset ? "border-ink" : "border-line"}`} title="Escolher cor personalizada">
          <Pipette size={16} aria-hidden="true" />
          <input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} aria-label="Escolher cor personalizada" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-secondary">
        <span className="h-4 w-4 rounded border border-black/10" style={{ backgroundColor: value }} />
        <span>{isPreset ? storeColorOptions.find((option) => option.value === normalized)?.name : "Personalizada"}</span>
        <span className="font-mono text-ink-secondary">{value.toUpperCase()}</span>
      </div>
    </fieldset>
  );
}
