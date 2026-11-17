import { Check, Pipette } from "lucide-react";

export const storeColorOptions = [
  { name: "Roxo", value: "#7351D6" },
  { name: "Azul", value: "#3B6FE8" },
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
      <legend className="text-sm font-semibold text-[#403a47]">Cor principal</legend>
      <p className="mt-1 text-xs text-[#898390]">Ela será usada nos destaques da sua loja.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {storeColorOptions.map((option) => {
          const selected = normalized === option.value;
          return (
            <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-label={`${option.name}${selected ? ", selecionada" : ""}`} aria-pressed={selected} title={option.name} className={`grid h-10 w-10 place-items-center rounded-full border-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7351d6]/20 ${selected ? "border-[#332d3b]" : "border-transparent"}`}>
              <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ backgroundColor: option.value }}>{selected && <Check size={15} strokeWidth={3} />}</span>
            </button>
          );
        })}
        <label className={`relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full border-2 bg-white text-[#6f6875] transition hover:border-[#b8a9d7] focus-within:ring-4 focus-within:ring-[#7351d6]/20 ${!isPreset ? "border-[#332d3b]" : "border-[#e5e1e9]"}`} title="Escolher cor personalizada">
          <Pipette size={16} aria-hidden="true" />
          <input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} aria-label="Escolher cor personalizada" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#898390]">
        <span className="h-4 w-4 rounded border border-black/10" style={{ backgroundColor: value }} />
        <span>{isPreset ? storeColorOptions.find((option) => option.value === normalized)?.name : "Personalizada"}</span>
        <span className="font-mono text-[#aaa5b0]">{value.toUpperCase()}</span>
      </div>
    </fieldset>
  );
}
