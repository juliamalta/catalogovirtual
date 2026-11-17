import { describe, expect, it } from "vitest";
import { addCartLine, changeCartQuantity } from "@/hooks/use-cart";
import type { StoreProduct } from "@/types/store.types";

const product: StoreProduct = { id: "shirt", name: "Camisa", description: "Algodão", priceCents: 12990, image: "", category: "Essenciais", options: ["P", "M"] };

describe("cart lines", () => {
  it("groups identical variants and keeps different variants separate", () => {
    const first = addCartLine([], product, "P");
    const grouped = addCartLine(first, product, "P");
    const separate = addCartLine(grouped, product, "M");
    expect(separate).toHaveLength(2);
    expect(separate.map((line) => line.quantity)).toEqual([2, 1]);
  });

  it("keeps notes distinct and removes a line when its quantity reaches zero", () => {
    const lines = addCartLine(addCartLine([], product, undefined, "Sem açúcar"), product, undefined, "Com laço");
    expect(lines).toHaveLength(2);
    expect(changeCartQuantity(lines, lines[0].key, 0)).toHaveLength(1);
  });

  it("uses integer cents for totals", () => {
    const lines = addCartLine(addCartLine([], product), product);
    const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
    expect(total).toBe(25980);
  });
});
