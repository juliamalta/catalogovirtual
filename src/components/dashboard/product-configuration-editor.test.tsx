import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductConfigurationEditor } from "./product-configuration-editor";
import type { ProductConfigurationDTO, ProductType } from "@/types/product-configuration.types";

const configuration: ProductConfigurationDTO = {
  availabilityMode: "WEEKDAYS",
  availableDays: [1, 3, 5],
  optionGroups: [{
    id: "size", name: "Tamanho", kind: "VARIANT", isRequired: true,
    minSelections: 1, maxSelections: 1, isActive: true, sortOrder: 0,
    options: [{ id: "small", name: "Pequena", priceCents: 1850, priceDeltaCents: 0, isActive: true, sortOrder: 0 }]
  }, {
    id: "sides", name: "Acompanhamentos", kind: "CUSTOMIZATION", isRequired: false,
    minSelections: 0, maxSelections: 2, isActive: true, sortOrder: 1,
    options: [{ id: "salad", name: "Salada", priceCents: null, priceDeltaCents: 250, isActive: false, sortOrder: 0 }]
  }],
  priceRules: [{ id: "combo", name: "Combo", priceCents: 2000, optionIds: ["small", "salad"], isActive: true, sortOrder: 0 }]
};

function renderEditor(type: ProductType, initialConfiguration?: ProductConfigurationDTO) {
  return renderToStaticMarkup(createElement(ProductConfigurationEditor, {
    productType: type, initialConfiguration, onProductTypeChange: () => {},
    basicFields: "BASIC_FIELDS", basePriceField: "BASE_PRICE",
    simpleOptionsField: "SIMPLE_OPTIONS", imageFields: "IMAGE_UPLOAD", availabilityFields: "VISIBILITY"
  }));
}

function serializedConfiguration(html: string) {
  const value = html.match(/name="productConfiguration" value="([^"]*)"/)?.[1];
  expect(value).toBeDefined();
  return JSON.parse(value!.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
}

describe("Product configuration editor", () => {
  it.each<ProductType>(["SIMPLE", "VARIATIONS", "BUILDABLE"])("keeps the section order and upload for %s", (type) => {
    const html = renderEditor(type);
    const titles = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((match) => match[1]);
    expect(titles).toEqual(["Tipo de produto", "Informações básicas", "Preços e variações", "Personalizações", "Imagens", "Disponibilidade"]);
    expect(html).toContain("IMAGE_UPLOAD");
    expect(html).toContain('aria-label="Tipo de produto"');
    expect(html).toContain(`name="productType" value="${type}"`);
  });

  it("preserves edit identifiers, inactive options, prices, rules and weekdays in collapsed panels", () => {
    const html = renderEditor("BUILDABLE", configuration);
    const payload = serializedConfiguration(html);
    expect(payload.availability).toEqual({ mode: "WEEKDAYS", days: [1, 3, 5] });
    expect(payload.optionGroups).toHaveLength(2);
    expect(payload.optionGroups[0]).toEqual(configuration.optionGroups[0]);
    expect(payload.optionGroups[1]).toMatchObject({
      id: "sides", name: "Acompanhamentos", minSelections: 0, maxSelections: 2,
      options: [{ id: "salad", name: "Salada", priceDeltaCents: 250, isActive: false }]
    });
    expect(payload.priceRules).toEqual(configuration.priceRules);
    expect(html).toContain('name="productConfigurationDeletes" value="{&quot;groupIds&quot;:[],&quot;optionIds&quot;:[],&quot;priceRuleIds&quot;:[]}"');
    expect(html).toContain('value="20,00"');
    expect(html).not.toContain("<details open");
  });

  it("places variation fields before customizations and customizations before images", () => {
    const html = renderEditor("BUILDABLE", configuration);
    expect(html.indexOf('value="Tamanho"')).toBeLessThan(html.indexOf('value="Acompanhamentos"'));
    expect(html.indexOf('value="Acompanhamentos"')).toBeLessThan(html.indexOf("IMAGE_UPLOAD"));
  });
});
