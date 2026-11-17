import type { CartLine, StoreDemo } from "@/types/store.types";
import { buildWhatsAppUrl, formatPrice } from "@/lib/utils";
export function makeOrderMessage(store: StoreDemo, lines: CartLine[]): string {
  const items = lines.map(({ product, quantity, option, note }) => `${quantity}x ${product.name}${option ? ` (${option})` : ""}\n${formatPrice(product.priceCents)} cada · subtotal: ${formatPrice(product.priceCents * quantity)}${note ? `\nObs.: ${note}` : ""}`).join("\n\n");
  const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
  return `Olá! Encontrei a ${store.name} pelo Catálogo Loja Virtual e gostaria de fazer um pedido.\n\n*Meu pedido:*\n\n${items}\n\n*Total dos produtos: ${formatPrice(total)}*\n\nGostaria de confirmar a disponibilidade e combinar a entrega.`;
}
export function makeOrderUrl(store: StoreDemo, lines: CartLine[]): string { return buildWhatsAppUrl(store.whatsapp, makeOrderMessage(store, lines)); }
