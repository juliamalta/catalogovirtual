import { describe, expect, it } from "vitest";
import { createStoreSchema, productInputSchema } from "@/lib/validations/store";

describe("store validation", () => {
  it("normalizes and validates Brazilian WhatsApp numbers", () => {
    const parsed = createStoreSchema.safeParse({ name: "Loja", slug: "loja", description: "", storefrontType: "CATALOG", whatsappNumber: "+55 (11) 99999-9999", primaryColor: "#7351D6" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.whatsappNumber).toBe("5511999999999");
  });

  it("rejects reserved and malformed public slugs", () => {
    expect(createStoreSchema.safeParse({ name: "Loja", slug: "painel", storefrontType: "CATALOG", whatsappNumber: "5511999999999", primaryColor: "#7351D6" }).success).toBe(false);
    expect(createStoreSchema.safeParse({ name: "Loja", slug: "Loja Inválida", storefrontType: "CATALOG", whatsappNumber: "5511999999999", primaryColor: "#7351D6" }).success).toBe(false);
  });

  it("converts Brazilian prices to cents and rejects negative values", () => {
    const base = { name: "Produto", description: "", categoryId: "", imageUrl: "", options: "", isActive: true, isFeatured: false, sortOrder: 0 };
    expect(productInputSchema.parse({ ...base, price: "12,50" }).price).toBe(1250);
    expect(productInputSchema.safeParse({ ...base, price: "-1,00" }).success).toBe(false);
  });
});
