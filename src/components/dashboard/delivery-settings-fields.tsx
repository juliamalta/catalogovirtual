"use client";

import { useState } from "react";
import type { DeliveryConfiguration, DeliveryFeeType } from "@/features/cart/checkout";

export function DeliverySettingsFields({ configuration, persistenceAvailable }: { configuration: DeliveryConfiguration; persistenceAvailable: boolean }) {
  const [delivery, setDelivery] = useState(configuration.deliveryEnabled);
  const [feeType, setFeeType] = useState<DeliveryFeeType>(configuration.feeType);
  return <>
    <label className="dashboard-checkbox-field"><input name="deliveryEnabled" type="checkbox" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} /><span><strong>Oferece entrega</strong><small>Permita que clientes escolham receber o pedido.</small></span></label>
    <label className="dashboard-checkbox-field"><input name="pickupEnabled" type="checkbox" defaultChecked={configuration.pickupEnabled} /><span><strong>Oferece retirada</strong><small>Permita retirar o pedido no local.</small></span></label>
    {delivery && <>
      {!persistenceAvailable && <p role="status" className="form-hint">As taxas de entrega ainda não estão disponíveis para configuração. Por enquanto, o frete será combinado com a loja.</p>}
      <label className="field">Tipo de taxa de entrega<select name="deliveryFeeType" value={feeType} onChange={(event) => setFeeType(event.target.value as DeliveryFeeType)} disabled={!persistenceAvailable}>
        <option value="FIXED">Taxa fixa</option><option value="FREE">Entrega gratuita</option><option value="TO_AGREE">Frete a combinar</option>
      </select></label>
      {feeType === "FIXED" && <label className="field">Taxa de entrega (R$)<input name="deliveryFixedFee" type="text" inputMode="decimal" required disabled={!persistenceAvailable} placeholder="12,50" defaultValue={configuration.fixedFeeCents === null ? "" : (configuration.fixedFeeCents / 100).toFixed(2).replace(".", ",")} /><small>Use o formato 12,50.</small></label>}
    </>}
  </>;
}
