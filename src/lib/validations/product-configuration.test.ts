import { describe, expect, it } from "vitest";
import { productEditorConfigurationSchema } from "@/lib/validations/product-configuration";

const variantId = "11111111-1111-4111-8111-111111111111";
const customId = "22222222-2222-4222-8222-222222222222";
const smallId = "33333333-3333-4333-8333-333333333333";
const largeId = "44444444-4444-4444-8444-444444444444";
const chickenId = "55555555-5555-4555-8555-555555555555";
const beefId = "66666666-6666-4666-8666-666666666666";

const variantGroup = {
  id: variantId, name: "Tamanho", kind: "VARIANT", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0,
  options: [
    { id: smallId, name: "Pequena", priceCents: 2_000, priceDeltaCents: 0, isActive: true, sortOrder: 0 },
    { id: largeId, name: "Grande", priceCents: 2_500, priceDeltaCents: 0, isActive: true, sortOrder: 1 }
  ]
};

const meatGroup = {
  id: customId, name: "Proteína", kind: "CUSTOMIZATION", isRequired: true, minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 1,
  options: [
    { id: chickenId, name: "Frango", priceDeltaCents: 0, isActive: true, sortOrder: 0 },
    { id: beefId, name: "Carne", priceDeltaCents: 0, isActive: true, sortOrder: 1 }
  ]
};

function editor(productType: "SIMPLE" | "VARIATIONS" | "BUILDABLE", optionGroups: unknown[] = [], priceRules: unknown[] = []) {
  return productEditorConfigurationSchema.safeParse({
    productType,
    configuration: { availability: { mode: "ALWAYS", days: [] }, optionGroups, priceRules }
  });
}

describe("product editor configuration validation", () => {
  it("accepts simple products without advanced groups", () => {
    expect(editor("SIMPLE").success).toBe(true);
  });

  it("accepts free-form size and price variations", () => {
    expect(editor("VARIATIONS", [variantGroup]).success).toBe(true);
  });

  it("accepts a buildable product with groups and mutually exclusive combination prices", () => {
    const result = editor("BUILDABLE", [variantGroup, meatGroup], [
      { name: "Pequena com frango", priceCents: 2_200, optionIds: [smallId, chickenId], isActive: true, sortOrder: 0 },
      { name: "Pequena com carne", priceCents: 2_400, optionIds: [smallId, beefId], isActive: true, sortOrder: 1 }
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects two active price rules that can match the same selection", () => {
    const result = editor("BUILDABLE", [variantGroup, meatGroup], [
      { name: "Pequena com frango", priceCents: 2_200, optionIds: [smallId], isActive: true, sortOrder: 0 },
      { name: "Frango com tamanho", priceCents: 2_300, optionIds: [smallId, chickenId], isActive: true, sortOrder: 1 }
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects invalid minimum and maximum group selections", () => {
    const invalidGroup = { ...meatGroup, minSelections: 2, maxSelections: 1 };
    expect(editor("BUILDABLE", [invalidGroup]).success).toBe(false);
  });
});
