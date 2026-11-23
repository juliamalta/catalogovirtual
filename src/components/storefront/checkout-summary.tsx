import { formatPrice } from "@/lib/utils";
import type { DeliveryConfiguration, FulfillmentMode } from "@/features/cart/checkout";
import { availableFulfillmentModes, calculateCheckout } from "@/features/cart/checkout";

export function CheckoutSummary({ configuration, summary, mode, onModeChange }: {
  configuration: DeliveryConfiguration;
  summary: ReturnType<typeof calculateCheckout>;
  mode: FulfillmentMode | null;
  onModeChange: (mode: FulfillmentMode) => void;
}) {
  const modes = availableFulfillmentModes(configuration);
  return <div className="checkout-summary">
    {modes.length > 0 ? <fieldset className="checkout-modalities"><legend>Como deseja receber?</legend>
      {modes.map((option) => <label key={option}><input type="radio" name="fulfillmentMode" value={option} checked={mode === option} onChange={() => onModeChange(option)} />{option === "DELIVERY" ? "Entrega" : "Retirada no local"}</label>)}
    </fieldset> : <p role="status">A loja não disponibilizou entrega ou retirada. Não é possível continuar com este pedido.</p>}
    <div className="subtotal-line"><span>Subtotal dos produtos</span><b>{formatPrice(summary.subtotalCents)}</b></div>
    {mode === "DELIVERY" && summary.feeCents !== null && <div className="subtotal-line"><span>Taxa de entrega</span><b>{summary.feeCents === 0 ? "Grátis" : formatPrice(summary.feeCents)}</b></div>}
    {mode === "PICKUP" && <p>Retirada no local · sem taxa de entrega.</p>}
    <div aria-live="polite" aria-atomic="true">
      {summary.freightToAgree && <p>Frete a combinar. O valor será confirmado pelo estabelecimento. O subtotal não inclui o frete.</p>}
      {summary.totalCents !== null && <div className="subtotal-line checkout-total"><span>Total final</span><b>{formatPrice(summary.totalCents)}</b></div>}
    </div>
  </div>;
}
