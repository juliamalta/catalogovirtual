import type { CartLine, StoreDemo } from "@/types/store.types";
import { buildWhatsAppUrl, formatPrice } from "@/lib/utils";
import { availableFulfillmentModes, calculateCheckout, defaultDeliveryConfiguration, type FulfillmentMode } from "./checkout";
export function makeOrderMessage(store: StoreDemo, lines: CartLine[], mode?: FulfillmentMode | null): string {
  const configuration = store.delivery ?? defaultDeliveryConfiguration;
  const selected = mode === undefined ? availableFulfillmentModes(configuration)[0] ?? null : mode;
  const checkout = calculateCheckout(lines, configuration, selected);
  if (!checkout.canCheckout) throw new Error("Selecione uma modalidade de atendimento disponível.");
  const items = lines.map(({ product, quantity, option, note }) => `${quantity}x ${product.name}${option ? ` (${option})` : ""}\n${formatPrice(product.priceCents)} cada · subtotal: ${formatPrice(product.priceCents * quantity)}${note ? `\nObs.: ${note}` : ""}`).join("\n\n");
  const summary = [`*Subtotal dos produtos: ${formatPrice(checkout.subtotalCents)}*`, `Modalidade: ${selected === "PICKUP" ? "Retirada no local" : "Entrega"}`];
  if (selected === "DELIVERY") summary.push(checkout.freightToAgree ? "Frete a combinar: o valor será confirmado pelo estabelecimento. O subtotal não inclui o frete." : `Taxa de entrega: ${checkout.feeCents === 0 ? "Grátis (R$ 0,00)" : formatPrice(checkout.feeCents!)}`);
  if (checkout.totalCents !== null) summary.push(`*Total final: ${formatPrice(checkout.totalCents)}*`);
  summary.push("Gostaria de confirmar a disponibilidade dos produtos.");
  return `Olá! Encontrei a ${store.name} pelo Catálogo Loja Virtual e gostaria de fazer um pedido.\n\n*Meu pedido:*\n\n${items}\n\n${summary.join("\n\n")}`;
}
export function makeOrderUrl(store: StoreDemo, lines: CartLine[], mode?: FulfillmentMode | null): string { return buildWhatsAppUrl(store.whatsapp, makeOrderMessage(store, lines, mode)); }
