import { describe, expect, it } from "vitest";
import { filterDashboardProducts } from "./dashboard-product-filters";

const products = [
  { id: "1", name: "Café com leite", categoryId: "drinks", isActive: true },
  { id: "2", name: "Bolo de chocolate", categoryId: "sweets", isActive: false },
  { id: "3", name: "Café gelado", categoryId: null, isActive: true },
];
describe("dashboard product filters", () => {
  it("matches case, accents and extra whitespace without changing catalog data", () => {
    expect(filterDashboardProducts(products, { q: " CAFE " }).map((product) => product.id)).toEqual(["1", "3"]);
    expect(products[0].name).toBe("Café com leite");
  });
  it("combines category and visibility and supports uncategorized products", () => {
    expect(filterDashboardProducts(products, { category: "sweets", availability: "inactive" })).toEqual([products[1]]);
    expect(filterDashboardProducts(products, { category: "none", q: "café" })).toEqual([products[2]]);
    expect(filterDashboardProducts(products, { category: "sweets", availability: "active" })).toEqual([]);
  });
  it("restores all products with cleared filters and handles empty data", () => {
    expect(filterDashboardProducts(products, {})).toEqual(products);
    expect(filterDashboardProducts([], { q: "café" })).toEqual([]);
  });
});
