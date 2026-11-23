import type { CartLine } from "@/types/store.types";

export type DeliveryFeeType = "FIXED" | "FREE" | "TO_AGREE";
export type FulfillmentMode = "DELIVERY" | "PICKUP";
export interface DeliveryConfiguration {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  feeType: DeliveryFeeType;
  fixedFeeCents: number | null;
}

export const defaultDeliveryConfiguration: DeliveryConfiguration = {
  deliveryEnabled: false, pickupEnabled: true, feeType: "TO_AGREE", fixedFeeCents: null,
};
export function availableFulfillmentModes(configuration: DeliveryConfiguration): FulfillmentMode[] {
  return [...(configuration.deliveryEnabled ? ["DELIVERY" as const] : []), ...(configuration.pickupEnabled ? ["PICKUP" as const] : [])];
}
export function calculateCheckout(lines: CartLine[], configuration: DeliveryConfiguration, mode: FulfillmentMode | null) {
  let subtotalCents = 0;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || !Number.isSafeInteger(line.product.priceCents) || line.product.priceCents < 0) throw new Error("Confira os valores do carrinho.");
    subtotalCents += line.product.priceCents * line.quantity;
  }
  if (!Number.isSafeInteger(subtotalCents)) throw new Error("O valor do pedido excede o limite permitido.");
  const available = availableFulfillmentModes(configuration);
  const canCheckout = mode !== null && available.includes(mode) && lines.length > 0;
  let feeCents: number | null = null;
  if (canCheckout && mode === "PICKUP") feeCents = 0;
  if (canCheckout && mode === "DELIVERY") {
    if (configuration.feeType === "FREE") feeCents = 0;
    else if (configuration.feeType === "FIXED") {
      if (!Number.isSafeInteger(configuration.fixedFeeCents) || configuration.fixedFeeCents === null || configuration.fixedFeeCents < 0) throw new Error("A taxa de entrega não está configurada corretamente.");
      feeCents = configuration.fixedFeeCents;
    }
  }
  const totalCents = canCheckout && feeCents !== null ? subtotalCents + feeCents : null;
  if (totalCents !== null && !Number.isSafeInteger(totalCents)) throw new Error("O valor do pedido excede o limite permitido.");
  return { subtotalCents, feeCents, totalCents, canCheckout, mode, freightToAgree: canCheckout && mode === "DELIVERY" && configuration.feeType === "TO_AGREE" };
}
