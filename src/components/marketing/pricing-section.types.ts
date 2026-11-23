export interface PricingPlanFeature {
  label: string;
}

export interface PricingPlan {
  name: string;
  monthlyPriceCents: number;
  description: string;
  features: PricingPlanFeature[];
}

export interface PricingSectionProps {
  title: string;
  description: string;
  plan: PricingPlan;
}
