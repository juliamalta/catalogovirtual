import { MessageCircle, Smartphone } from "lucide-react";
import { StoreColorPicker } from "./StoreColorPicker";

interface StoreContactStepProps {
  whatsappNumber: string;
  primaryColor: string;
  errors: Record<string, string>;
  onWhatsappChange: (value: string) => void;
  onPrimaryColorChange: (value: string) => void;
}

export function StoreContactStep({ whatsappNumber, primaryColor, errors, onWhatsappChange, onPrimaryColorChange }: StoreContactStepProps) {
  return (
    <section aria-labelledby="contact-title" className="space-y-6">
      <div>
        <h2 id="contact-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-ink outline-none sm:text-[28px]">Sua loja está quase pronta.</h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Defina como seus clientes falam com você e escolha uma cor para a marca.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="store-whatsapp" className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><MessageCircle size={16} className="text-brand" /> WhatsApp da loja</label>
          <div className={`flex items-center gap-2 rounded-xl border bg-surface px-3 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 ${errors.whatsappNumber ? "border-error-border" : "border-line hover:border-brand/40"}`}>
            <Smartphone size={17} className="shrink-0 text-ink-secondary" />
            <input id="store-whatsapp" name="whatsappNumber" className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-ink-secondary" value={whatsappNumber} onChange={(event) => onWhatsappChange(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+55 (11) 99999-9999" aria-invalid={Boolean(errors.whatsappNumber)} aria-describedby={errors.whatsappNumber ? "store-whatsapp-error" : "store-whatsapp-help"} />
          </div>
          {errors.whatsappNumber ? <p id="store-whatsapp-error" className="mt-1.5 text-xs text-error">{errors.whatsappNumber}</p> : <p id="store-whatsapp-help" className="mt-1.5 text-xs text-ink-secondary">Inclua o DDI 55 e o DDD para receber os pedidos.</p>}
        </div>

        <StoreColorPicker value={primaryColor} onChange={onPrimaryColorChange} />
      </div>
    </section>
  );
}
