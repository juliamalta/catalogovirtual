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
        <h2 id="contact-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-[#292431] outline-none sm:text-[28px]">Sua loja está quase pronta.</h2>
        <p className="mt-2 text-sm leading-6 text-[#77717f]">Defina como seus clientes falam com você e escolha uma cor para a marca.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="store-whatsapp" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#403a47]"><MessageCircle size={16} className="text-[#7351d6]" /> WhatsApp da loja</label>
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 transition focus-within:border-[#8b6be0] focus-within:ring-4 focus-within:ring-[#7351d6]/10 ${errors.whatsappNumber ? "border-[#d98a94]" : "border-[#e6e2eb] hover:border-[#cfc8d8]"}`}>
            <Smartphone size={17} className="shrink-0 text-[#aaa5b0]" />
            <input id="store-whatsapp" name="whatsappNumber" className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[#302a38] outline-none placeholder:text-[#aaa5b0]" value={whatsappNumber} onChange={(event) => onWhatsappChange(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+55 (11) 99999-9999" aria-invalid={Boolean(errors.whatsappNumber)} aria-describedby={errors.whatsappNumber ? "store-whatsapp-error" : "store-whatsapp-help"} />
          </div>
          {errors.whatsappNumber ? <p id="store-whatsapp-error" className="mt-1.5 text-xs text-[#b54756]">{errors.whatsappNumber}</p> : <p id="store-whatsapp-help" className="mt-1.5 text-xs text-[#898390]">Inclua o DDI 55 e o DDD para receber os pedidos.</p>}
        </div>

        <StoreColorPicker value={primaryColor} onChange={onPrimaryColorChange} />
      </div>
    </section>
  );
}
