import { describe, expect, it } from "vitest";
import { parseProductEditorData } from "@/server/services/product-configuration.service";

const variantGroupId = "11111111-1111-4111-8111-111111111111";
const smallOptionId = "22222222-2222-4222-8222-222222222222";
const largeOptionId = "33333333-3333-4333-8333-333333333333";
const customGroupId = "44444444-4444-4444-8444-444444444444";
const chickenOptionId = "55555555-5555-4555-8555-555555555555";

function form(productType: string, price: string, configuration: unknown) {
  const result = new FormData();
  result.set("productType", productType);
  result.set("price", price);
  result.set("productConfiguration", JSON.stringify(configuration));
  return result;
}

describe("parseProductEditorData", () => {
  it("derives the base price from active variation options instead of trusting the form price", () => {
    const parsed = parseProductEditorData(form("VARIATIONS", "999,99", {
      availability: { mode: "ALWAYS", days: [] },
      optionGroups: [{ id: variantGroupId, name: "Tamanho", kind: "VARIANT", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [
        { id: smallOptionId, name: "Pequena", priceCents: 2_000, priceDeltaCents: 0, isActive: true, sortOrder: 0 },
        { id: largeOptionId, name: "Grande", priceCents: 2_500, priceDeltaCents: 0, isActive: true, sortOrder: 1 }
      ] }],
      priceRules: []
    }));
    expect(parsed.productType).toBe("VARIATIONS");
    expect(parsed.priceCents).toBe(2_000);
  });

  it("parses a buildable base price and weekday availability", () => {
    const parsed = parseProductEditorData(form("BUILDABLE", "18,90", {
      availability: { mode: "WEEKDAYS", days: [1, 3, 5] },
      optionGroups: [{ id: customGroupId, name: "Proteína", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [
        { id: chickenOptionId, name: "Frango", priceDeltaCents: 0, isActive: true, sortOrder: 0 }
      ] }],
      priceRules: []
    }));
    expect(parsed.priceCents).toBe(1_890);
    expect(parsed.configuration.availability).toEqual({ mode: "WEEKDAYS", days: [1, 3, 5] });
  });

  it("rejects incomplete or malformed configuration payloads", () => {
    const invalid = form("BUILDABLE", "18,90", { availability: { mode: "ALWAYS", days: [] }, optionGroups: [], priceRules: [] });
    expect(() => parseProductEditorData(invalid)).toThrow(/montável/i);
    const malformed = form("SIMPLE", "10,00", {});
    expect(() => parseProductEditorData(malformed)).toThrow();
  });
});
