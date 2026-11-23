import { describe, expect, it } from "vitest";
import { addCartLine, changeCartQuantity } from "@/hooks/use-cart";
import type { StoreProduct } from "@/types/store.types";

const product: StoreProduct = { id: "shirt", name: "Camisa", description: "Algodão", priceCents: 12990, image: "", category: "Essenciais", options: ["P", "M"] };
const simple = { ...product, options: [] };

describe("cart lines", () => {
  it("groups identical variants and keeps different variants separate", () => {
    const first = addCartLine([], product, "P");
    const grouped = addCartLine(first, product, "P");
    const separate = addCartLine(grouped, product, "M");
    expect(separate).toHaveLength(2);
    expect(separate.map((line) => line.quantity)).toEqual([2, 1]);
  });

  it("keeps notes distinct and removes a line when its quantity reaches zero", () => {
    const lines = addCartLine(addCartLine([], simple, undefined, "Sem açúcar"), simple, undefined, "Com laço");
    expect(lines).toHaveLength(2);
    expect(changeCartQuantity(lines, lines[0].key, 0)).toHaveLength(1);
  });

  it("uses integer cents for totals", () => {
    const lines = addCartLine(addCartLine([], simple), simple);
    const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
    expect(total).toBe(25980);
  });

  it("adds, increments, decrements and removes a simple product", () => {
    let lines = addCartLine([], simple);
    expect(lines[0].quantity).toBe(1);
    lines = addCartLine(lines, simple);
    expect(lines[0].quantity).toBe(2);
    lines = changeCartQuantity(lines, lines[0].key, 1);
    expect(lines[0].quantity).toBe(1);
    expect(changeCartQuantity(lines, lines[0].key, 0)).toEqual([]);
  });

  it("rejects missing or invalid variations instead of choosing automatically", () => {
    expect(() => addCartLine([], product)).toThrow("Escolha uma opção");
    expect(() => addCartLine([], product, "GG")).toThrow("Escolha uma opção");
  });

  it("preserves and increments existing persisted cart lines", () => {
    const restored = JSON.parse(JSON.stringify([{ key: "shirt::", product: simple, quantity: 2 }]));
    const lines = addCartLine(restored, simple);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ key: "shirt::", quantity: 3 });
    expect(changeCartQuantity(lines, lines[0].key, NaN)).toEqual(lines);
  });
});
