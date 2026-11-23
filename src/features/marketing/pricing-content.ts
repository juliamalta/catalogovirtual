import type { PricingPlan } from "@/components/marketing/pricing-section.types";

export const uniquePricingPlan: PricingPlan = {
  name: "Plano Único",
  monthlyPriceCents: 1990,
  description: "Tudo para colocar sua loja online.",
  features: [
    { label: "Uma loja virtual" },
    { label: "Cardápio Digital, Catálogo Online ou Vitrine Online" },
    { label: "Cadastro de produtos e categorias" },
    { label: "Carrinho de compras" },
    { label: "Pedidos pelo WhatsApp" },
    { label: "Personalização da loja" },
    { label: "Link exclusivo para compartilhar" },
  ],
};
