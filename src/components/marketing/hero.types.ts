import type { ReactNode } from "react";
import type { StoreDemo } from "@/types/store.types";

export interface HeroProps {
  title: ReactNode;
  description: string;
  primaryHref: string;
  secondaryHref: string;
  sampleStore: StoreDemo;
}
