import { describe, expect, it } from "vitest";
import { reconcileCart } from "./cart-reconciliation";
import { addCartLine } from "@/hooks/use-cart";
import type { StoreProduct } from "@/types/store.types";

const product: StoreProduct = { id: "local", name: "Produto atual", priceCents: 1250, description: "", image: "", category: "" };
const selections = { size: ["small"], meat: ["chicken"], sides: ["rice"], extras: ["egg"] };
const meal: StoreProduct = {
  ...product, id: "meal", priceCents: 1800, productType: "BUILDABLE",
  configuration: { availabilityMode: "ALWAYS", availableDays: [], priceRules: [], optionGroups: [
    { id: "size", name: "Tamanho", kind: "VARIANT", isActive: true, isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 0,
      options: [{ id: "small", name: "Pequena", priceCents: 2000, priceDeltaCents: 0, isActive: true, sortOrder: 0 }] },
    { id: "meat", name: "Carne", kind: "CUSTOMIZATION", isActive: true, isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 1,
      options: [{ id: "chicken", name: "Frango", priceCents: null, priceDeltaCents: 0, isActive: true, sortOrder: 0 }, { id: "beef", name: "Carne", priceCents: null, priceDeltaCents: 500, isActive: true, sortOrder: 1 }] },
    { id: "sides", name: "Guarnição", kind: "CUSTOMIZATION", isActive: true, isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 2,
      options: [{ id: "rice", name: "Arroz", priceCents: null, priceDeltaCents: 0, isActive: true, sortOrder: 0 }] },
    { id: "extras", name: "Adicionais", kind: "CUSTOMIZATION", isActive: true, isRequired: false, minSelections: 0, maxSelections: 1, sortOrder: 3,
      options: [{ id: "egg", name: "Ovo", priceCents: null, priceDeltaCents: 300, isActive: true, sortOrder: 0 }] },
  ] },
};
describe("cart restored from the current store catalog", () => {
  it("replaces browser prices and names instead of trusting persisted snapshots", () => {
    const saved = [{ key: "old", product: { ...product, name: "Alterado", priceCents: 1 }, quantity: 2 }];
    const result = reconcileCart(saved, [product]);
    expect(result[0].product).toEqual(product);
    expect(result[0].quantity * result[0].product.priceCents).toBe(2500);
  });
  it("removes products from another store, deleted products and unavailable products", () => {
    const saved = [product, { ...product, id: "foreign-store" }].map(item => ({ key: item.id, product: item, quantity: 1 }));
    expect(reconcileCart(saved, [{ ...product, unavailable: true }])).toEqual([]);
    expect(reconcileCart(saved, [])).toEqual([]);
    expect(reconcileCart(saved, [product])).toHaveLength(1);
  });
  it("recalculates meal choices, retaining distinct configurations and current combination prices", () => {
    const both = addCartLine(addCartLine([], meal, undefined, "Sem sal", { selections }), meal, undefined, "Sem sal", { selections: { ...selections, meat: ["beef"] } });
    const current = { ...meal, configuration: { ...meal.configuration!, priceRules: [{ id: "rule", name: "Combo", priceCents: 2100, optionIds: ["small", "chicken"], isActive: true, sortOrder: 0 }] } };
    const restored = reconcileCart(JSON.parse(JSON.stringify(both)), [current]);
    expect(restored).toHaveLength(2);
    expect(restored.map(line => line.product.priceCents)).toEqual([2400, 2800]);
    expect(restored.every(line => line.note === "Sem sal")).toBe(true);
  });
  it("drops removed/inactive/foreign option IDs and malformed selections", () => {
    const saved = addCartLine([], meal, undefined, undefined, { selections });
    for (const invalid of [{ ...selections, meat: ["foreign-option"] }, { ...selections, meat: ["chicken", "chicken"] }, { ...selections, unknown: ["chicken"] }, { ...selections, meat: "chicken" }, []]) {
      expect(reconcileCart([{ ...saved[0], selections: invalid }], [meal])).toEqual([]);
    }
    const inactive = { ...meal, configuration: { ...meal.configuration!, optionGroups: meal.configuration!.optionGroups.map(group => ({ ...group, options: group.options.map(option => ({ ...option, isActive: option.id !== "egg" && option.isActive })) })) } };
    expect(reconcileCart(saved, [inactive])).toEqual([]);
  });
  it("handles broken storage, invalid quantities and overflow without restoring invalid totals", () => {
    for (const saved of [null, {}, "invalid", [null], [{ quantity: -1, product }], [{ quantity: Number.MAX_SAFE_INTEGER, product }]]) expect(reconcileCart(saved, [product])).toEqual([]);
    const line = addCartLine([], product)[0];
    expect(reconcileCart([line, line], [product])[0].quantity).toBe(2);
  });
});
