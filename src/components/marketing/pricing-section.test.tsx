import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PricingSection } from "./pricing-section";
import { uniquePricingPlan } from "@/features/marketing/pricing-content";

function renderPricingSection() {
  return renderToStaticMarkup(createElement(PricingSection, {
    title: "Um plano. Tudo para sua loja online.",
    description: "Escolha o formato da sua loja.",
    plan: uniquePricingPlan
  }));
}

describe("PricingSection", () => {
  it("shows one R$ 19,90 plan and keeps checkout unavailable", () => {
    const html = renderPricingSection();

    expect(html.match(/<article\b/g)).toHaveLength(1);
    expect(html).toContain("Plano Único");
    expect(html).toMatch(/>19<\/span><span[^>]*>,90<\/span>/);
    expect(html).toMatch(/<button\b[^>]*disabled=""[^>]*>Assinatura em breve<\/button>/);
    expect(html).not.toContain("href=");
  });

  it("shows only the benefits configured for this plan", () => {
    const html = renderPricingSection();

    expect(uniquePricingPlan.features).toHaveLength(7);
    for (const feature of uniquePricingPlan.features) {
      expect(html).toContain(feature.label);
    }
  });
});
