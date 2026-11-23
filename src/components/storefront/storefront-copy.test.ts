import { describe, expect, it } from "vitest";
import { demoStores } from "@/features/stores/demo-data";
import type { StoreDemo } from "@/types/store.types";
import { resolveProductEmptyState, resolveStorefrontCopy } from "./storefront-copy";

function makeStore(overrides: Partial<StoreDemo> = {}): StoreDemo {
  return {
    slug: "restaurante-malta",
    name: "RestauranteMalta",
    tagline: "",
    subtitle: "",
    description: "Comida feita na hora para você.",
    type: "MENU",
    whatsapp: "5511999999999",
    accent: "#7549D9",
    background: "#FFFFFF",
    logo: "RM",
    cover: "",
    categories: [],
    products: [],
    ...overrides,
  };
}

describe("storefront copy", () => {
  it("uses the restaurant name and description when no custom hero copy exists", () => {
    const copy = resolveStorefrontCopy(makeStore());

    expect(copy.heroTitle).toBe("RestauranteMalta");
    expect(copy.heroSubtitle).toBe("Comida feita na hora para você.");
    expect(copy.productTitle).toBe("Nosso cardápio");
    expect(copy.heroAction).toBe("Ver cardápio");
    expect(copy.heroEyebrow).toBe("CARDÁPIO DIGITAL");
  });

  it("prefers the seller's configured headline and subtitle", () => {
    const copy = resolveStorefrontCopy(makeStore({
      tagline: "Sabores da casa",
      subtitle: "Almoço preparado todos os dias.",
    }));

    expect(copy.heroTitle).toBe("Sabores da casa");
    expect(copy.heroSubtitle).toBe("Almoço preparado todos os dias.");
  });

  it("does not assign demo candy copy to a real bakery", () => {
    const copy = resolveStorefrontCopy(makeStore({ name: "Doçaria real" }));

    expect(copy.productTitle).toBe("Nosso cardápio");
    expect(copy.productEyebrow).toBe("CARDÁPIO DIGITAL");
    expect(copy.aboutDescription).toBe("Comida feita na hora para você.");
    expect(copy.aboutSignature).toBeNull();
    expect(copy.footerSignature).toBeNull();
    expect(copy.heroAction).not.toContain("doces");
  });

  it("uses neutral product copy for a clothing catalog", () => {
    const copy = resolveStorefrontCopy(makeStore({ type: "CATALOG", name: "Malta Moda" }));

    expect(copy.productTitle).toBe("Nossos produtos");
    expect(copy.heroAction).toBe("Ver produtos");
    expect(copy.productEyebrow).toBe("CATÁLOGO ONLINE");
  });

  it("keeps configured identity and model copy for a personalized showcase", () => {
    const copy = resolveStorefrontCopy(makeStore({
      name: "Casa Malta",
      tagline: "Peças feitas para durar",
      subtitle: "Design local para sua casa.",
      type: "SHOWCASE",
    }));

    expect(copy.heroTitle).toBe("Peças feitas para durar");
    expect(copy.heroSubtitle).toBe("Design local para sua casa.");
    expect(copy.productTitle).toBe("Explore nossa coleção");
    expect(copy.heroAction).toBe("Explorar vitrine");
  });

  it("shows a dedicated empty state for stores without products", () => {
    expect(resolveProductEmptyState(0, false)).toEqual({
      message: "Nenhum produto disponível no momento.",
      showClearFilters: false,
    });
  });

  it("shows the search empty state only while filters are active", () => {
    expect(resolveProductEmptyState(4, true)).toEqual({
      message: "Nenhum produto encontrado para sua busca.",
      showClearFilters: true,
    });
    expect(resolveProductEmptyState(0, true).showClearFilters).toBe(true);
    expect(resolveProductEmptyState(4, false).showClearFilters).toBe(false);
  });

  it("preserves Casa Aurora's existing demonstration copy", () => {
    const copy = resolveStorefrontCopy(demoStores["casa-aurora"], true);

    expect(copy.heroTitle).toBe("Vista seu jeito de ser.");
    expect(copy.productTitle).toBe("Encontre seu próximo favorito");
    expect(copy.productEyebrow).toBe("FEITO COM CARINHO, ESCOLHIDO POR VOCÊ");
    expect(copy.aboutTitle).toBe("Pequenos detalhes. Grandes momentos.");
    expect(copy.footerSignature).toBe("feito com carinho");
  });

});
