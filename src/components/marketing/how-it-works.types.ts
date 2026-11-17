import type { ReactNode } from "react";
import type { LandingStep } from "@/features/marketing/landing.types";

export interface HowItWorksProps {
  title: ReactNode;
  description: string;
  actionHref: string;
  steps: LandingStep[];
}
