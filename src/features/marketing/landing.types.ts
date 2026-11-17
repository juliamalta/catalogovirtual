export interface LandingStoreModel {
  title: string;
  description: string;
  href: string;
  image: string;
  label: string;
}

export interface LandingStep {
  number: string;
  title: string;
  description: string;
}

export interface LandingFeature {
  icon: "store" | "message" | "sparkles" | "check";
  title: string;
  description: string;
}
