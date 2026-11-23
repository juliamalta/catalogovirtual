import { describe, expect, it } from "vitest";
import { makeOrderMessage, makeOrderUrl } from "@/features/cart/whatsapp";
import { formatPrice } from "@/lib/utils";
import { demoStores } from "@/features/stores/demo-data";
import type { CartLine } from "@/types/store.types";

describe("WhatsApp order", () => {
  const store = demoStores["doce-encanto"];
  const lines: CartLine[] = [{ key: "p1::", product: store.products[0], quantity: 2, note: "Sem morango" }];

  it("formats quantities, notes, line subtotal, and product total", () => {
    const message = makeOrderMessage(store, lines);
    expect(message).toContain("2x Bolo de morango");
    expect(message).toContain("Obs.: Sem morango");
    expect(message).toContain(`Subtotal dos produtos: ${formatPrice(3600)}`);
  });

  it("encodes the message in a wa.me URL", () => {
    const url = makeOrderUrl(store, lines);
    expect(url.startsWith(`https://wa.me/${store.whatsapp}?text=`)).toBe(true);
    expect(url).toContain(encodeURIComponent("Meu pedido"));
  });
});
