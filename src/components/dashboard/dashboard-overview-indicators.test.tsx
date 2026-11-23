import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardOverviewIndicators } from "./dashboard-overview-indicators";

const pending = { products: false, appearance: false, whatsapp: false, hours: false };
describe("overview indicators", () => {
  it("shows real counts including zero and an unpublished store without inventing completion", () => {
    const html = renderToStaticMarkup(createElement(DashboardOverviewIndicators, { productCount: 0, categoryCount: 0, isPublished: false, setup: pending }));
    expect(html).toContain("Produtos cadastrados");
    expect(html).toContain("Categorias");
    expect(html).toContain(">0<span");
    expect(html).toContain("Rascunho");
    expect(html).toContain("0 de 4");
    expect(html.match(/<strong>Pendente<\/strong>/g)).toHaveLength(2);
  });
  it("counts the saved setup flags independently of publication", () => {
    const html = renderToStaticMarkup(createElement(DashboardOverviewIndicators, { productCount: 17, categoryCount: 3, isPublished: true,
      setup: { ...pending, products: true, whatsapp: true } }));
    expect(html).toContain(">17<span");
    expect(html).toContain(">3<span");
    expect(html).toContain("Publicada");
    expect(html).toContain("2 de 4");
    expect(html.match(/<strong>Configurado<\/strong>/g)).toHaveLength(1);
    expect(html.match(/<strong>Pendente<\/strong>/g)).toHaveLength(1);
  });
});
