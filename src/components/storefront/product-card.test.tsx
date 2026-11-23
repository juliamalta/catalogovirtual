import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import type { ProductCardProps } from "./storefront-component.types";
import type { StoreProduct } from "@/types/store.types";

const product: StoreProduct = { id: "tete", name: "tete", description: "tete", priceCents: 1250,
  image: "", category: "", productType: "SIMPLE", options: [] };
function renderCard(item = product, quantity = 0, catalogTypography = true) {
  const props: ProductCardProps = {
    product: item, catalogTypography, accent: "#2563eb", onAdd() {}, onSelect() {},
    cart: { lines: quantity ? [{ key: "tete", product: item, quantity }] : [], count: quantity,
      totalCents: quantity * item.priceCents, fulfillmentMode: "PICKUP", setFulfillmentMode() {}, add() {}, setQuantity() {}, clear() {} }
  };
  return renderToStaticMarkup(createElement(ProductCard, props));
}
describe("product card actions without an image", () => {
  it.each([true, false])("renders the simple product action independently of typography (%s)", (catalog) => {
    const html = renderCard(product, 0, catalog);
    expect(html).toContain('aria-label="Adicionar tete"');
    expect(html).not.toContain('class="product-image-button"');
    expect(html).not.toContain('class="product-card-quantity"');
  });
  it("renders the cart quantity and decrement action when the item is in the cart", () => {
    const html = renderCard(product, 2);
    expect(html).toContain('aria-label="Diminuir quantidade de tete"');
    expect(html).toContain('aria-label="2 no pedido">2</span>');
    expect(html).toContain('aria-label="Adicionar tete"');
  });
  it.each(["VARIATIONS", "BUILDABLE"] as const)("offers visible choices for %s without an image", (productType) => {
    const html = renderCard({ ...product, productType });
    expect(html).toContain('aria-label="Escolher opções de tete"');
    expect(html).toContain('>Escolher opções</button>');
    expect(html).not.toContain('aria-label="Adicionar tete"');
  });
  it("preserves the unavailable product restriction", () => {
    expect(renderCard({ ...product, unavailable: true })).toMatch(/disabled="" aria-label="Adicionar tete"/);
  });
});
