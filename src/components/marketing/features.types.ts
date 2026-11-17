import type { ReactNode } from "react";
import type { LandingFeature } from "@/features/marketing/landing.types";

export interface FeaturesProps {
  title: ReactNode;
  description: string;
  features: LandingFeature[];
}
