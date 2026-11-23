import { describe, expect, it } from "vitest";
import { calculateConfiguredProductPrice, ProductConfigurationSelectionError } from "@/features/products/product-pricing";
import type { ProductConfigurationDTO } from "@/types/product-configuration.types";

const variantGroupId = "11111111-1111-4111-8111-111111111111";
const customGroupId = "22222222-2222-4222-8222-222222222222";
const smallId = "33333333-3333-4333-8333-333333333333";
const chickenId = "44444444-4444-4444-8444-444444444444";
const extraEggId = "55555555-5555-4555-8555-555555555555";

function configuration(priceRules: ProductConfigurationDTO["priceRules"] = []): ProductConfigurationDTO {
  return {
    availabilityMode: "ALWAYS",
    availableDays: [],
    optionGroups: [
      { id: variantGroupId, name: "Tamanho", kind: "VARIANT", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0, options: [
        { id: smallId, name: "Pequena", priceCents: 2_000, priceDeltaCents: 0, isActive: true, sortOrder: 0 }
      ] },
      { id: customGroupId, name: "Adicionais", kind: "CUSTOMIZATION", isRequired: false, minSelections: 0, maxSelections: 2, isActive: true, sortOrder: 1, options: [
        { id: chickenId, name: "Frango", priceCents: null, priceDeltaCents: 600, isActive: true, sortOrder: 0 },
        { id: extraEggId, name: "Ovo extra", priceCents: null, priceDeltaCents: 300, isActive: true, sortOrder: 1 }
      ] }
    ],
    priceRules
  };
}

describe("calculateConfiguredProductPrice", () => {
  it("uses the selected variation price and adds customization deltas", () => {
    const result = calculateConfiguredProductPrice(1_500, configuration(), {
      [variantGroupId]: [smallId], [customGroupId]: [chickenId, extraEggId]
    });
    expect(result).toEqual({ totalCents: 2_900, matchedPriceRuleId: null });
  });

  it("uses the combination price and charges only add-ons outside that combination", () => {
    const rule = { id: "66666666-6666-4666-8666-666666666666", name: "Pequena com frango", priceCents: 2_200, optionIds: [smallId, chickenId], isActive: true, sortOrder: 0 };
    const result = calculateConfiguredProductPrice(1_500, configuration([rule]), {
      [variantGroupId]: [smallId], [customGroupId]: [chickenId, extraEggId]
    });
    expect(result).toEqual({ totalCents: 2_500, matchedPriceRuleId: rule.id });
  });

  it("does not double charge an additional included in the combination price", () => {
    const rule = { id: "77777777-7777-4777-8777-777777777777", name: "Pequena com frango e ovo", priceCents: 2_400, optionIds: [smallId, chickenId, extraEggId], isActive: true, sortOrder: 0 };
    const result = calculateConfiguredProductPrice(1_500, configuration([rule]), {
      [variantGroupId]: [smallId], [customGroupId]: [chickenId, extraEggId]
    });
    expect(result.totalCents).toBe(2_400);
  });

  it("rejects selections outside the configured group limits", () => {
    expect(() => calculateConfiguredProductPrice(1_500, configuration(), { [variantGroupId]: [] }))
      .toThrow(ProductConfigurationSelectionError);
  });
});
