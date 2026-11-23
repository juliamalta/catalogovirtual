import { describe, expect, it } from "vitest";
import { addCartLine } from "@/hooks/use-cart";
import { makeOrderMessage } from "@/features/cart/whatsapp";
import { demoStores } from "@/features/stores/demo-data";
import type { StoreProduct } from "@/types/store.types";

const item = (id: string, name: string, delta = 0) => ({ id, name, priceCents: null, priceDeltaCents: delta, isActive: true, sortOrder: 0 });
export const meal: StoreProduct = {
  id: "meal", name: "Marmita", description: "Monte sua refeição", image: "", category: "Refeições", priceCents: 1800,
  productType: "BUILDABLE", configuration: {
    availabilityMode: "ALWAYS", availableDays: [], priceRules: [], optionGroups: [
      { id: "size", name: "Tamanho", kind: "VARIANT", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0,
        options: [{ ...item("small", "Pequena"), priceCents: 2000 }, { ...item("large", "Grande"), priceCents: 2500 }] },
      { id: "meat", name: "Carne", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 1,
        options: [item("chicken", "Frango"), item("beef", "Carne bovina", 500)] },
      { id: "sides", name: "Guarnições", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 2, isActive: true, sortOrder: 2,
        options: [item("rice", "Arroz"), item("beans", "Feijão"), item("salad", "Salada")] },
      { id: "extras", name: "Adicionais", kind: "CUSTOMIZATION", isRequired: false, minSelections: 0, maxSelections: 1, isActive: true, sortOrder: 3,
        options: [item("egg", "Ovo", 300), { ...item("inactive", "Inativo"), isActive: false }] },
    ]
  }
};
const selections = { size: ["small"], meat: ["chicken"], sides: ["rice", "beans"], extras: ["egg"] };

describe("configured cart", () => {
  it("requires a configured size and uses that variant's saved price", () => {
    const variant: StoreProduct = { ...meal, productType: "VARIATIONS", configuration: {
      ...meal.configuration!, optionGroups: [meal.configuration!.optionGroups[0]]
    } };
    expect(() => addCartLine([], variant)).toThrow();
    const small = addCartLine([], variant, undefined, undefined, { selections: { size: ["small"] } });
    const both = addCartLine(small, variant, undefined, undefined, { selections: { size: ["large"] } });
    expect(both.map((line) => line.product.priceCents)).toEqual([2000, 2500]);
    expect(both).toHaveLength(2);
  });
  it("rejects incomplete meals, excessive selections, inactive choices and invalid quantity", () => {
    expect(() => addCartLine([], meal)).toThrow();
    expect(() => addCartLine([], meal, undefined, undefined, { selections: { ...selections, sides: ["rice", "beans", "salad"] } })).toThrow();
    expect(() => addCartLine([], meal, undefined, undefined, { selections: { ...selections, extras: ["inactive"] } })).toThrow();
    expect(() => addCartLine([], meal, undefined, undefined, { selections, quantity: 0 })).toThrow();
    expect(() => addCartLine([], { ...meal, configuration: undefined })).toThrow("ainda não está disponível");
  });

  it("keeps different meals separate, groups equivalent choices and persists their details", () => {
    let lines = addCartLine([], meal, undefined, "Sem sal", { selections, quantity: 2 });
    expect(lines[0].product.priceCents).toBe(2300);
    lines = JSON.parse(JSON.stringify(lines));
    lines = addCartLine(lines, meal, undefined, "Sem sal", { selections: { ...selections, sides: ["beans", "rice"] } });
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
    lines = addCartLine(lines, meal, undefined, "Sem sal", { selections: { ...selections, meat: ["beef"] } });
    expect(lines).toHaveLength(2);
    expect(lines[1].product.priceCents).toBe(2800);
    const message = makeOrderMessage(demoStores["doce-encanto"], lines);
    expect(message).toContain("Carne: Frango");
    expect(message).toContain("Carne: Carne bovina");
    expect(message).toContain("Adicionais: Ovo");
    expect(message).toContain("Obs.: Sem sal");
  });
});
