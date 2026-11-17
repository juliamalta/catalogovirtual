import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, formatPrice } from "@/lib/utils";

describe("money and WhatsApp helpers", () => {
  it("formats cent values as Brazilian currency", () => {
    expect(formatPrice(1050)).toBe("R$ 10,50");
  });

  it("normalizes a WhatsApp number and rejects invalid numbers", () => {
    expect(buildWhatsAppUrl("+55 (11) 99999-9999", "Olá!" )).toBe("https://wa.me/5511999999999?text=Ol%C3%A1!");
    expect(() => buildWhatsAppUrl("123", "Oi")).toThrow("Configure um WhatsApp válido");
  });
});
