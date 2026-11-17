import type { ReactNode } from "react";
import type { LandingStoreModel } from "@/features/marketing/landing.types";

export interface StoreModelsProps {
  title: ReactNode;
  description: string;
  models: LandingStoreModel[];
}
