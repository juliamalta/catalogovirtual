import type { StoreProduct } from "@/types/store.types";

export type ProductAvailabilityMode = "ALWAYS" | "WEEKDAYS";
export type ProductOptionGroupKind = "VARIANT" | "CUSTOMIZATION";
export type ProductType = "SIMPLE" | "VARIATIONS" | "BUILDABLE";

export interface ProductOptionDTO {
  id: string;
  name: string;
  /** Exact unit price for a variant. Null for an additive customization. */
  priceCents: number | null;
  /** Nonnegative surcharge for a customization option. */
  priceDeltaCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductOptionGroupDTO {
  id: string;
  name: string;
  kind: ProductOptionGroupKind;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  sortOrder: number;
  options: ProductOptionDTO[];
}

export interface ProductPriceRuleDTO {
  id: string;
  name: string;
  /** Fixed unit price when the complete selected option set matches this rule. */
  priceCents: number;
  optionIds: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ProductConfigurationDTO {
  availabilityMode: ProductAvailabilityMode;
  /** ISO weekday numbering: Monday = 1 through Sunday = 7. */
  availableDays: number[];
  optionGroups: ProductOptionGroupDTO[];
  priceRules: ProductPriceRuleDTO[];
}

export type ConfiguredStoreProduct = StoreProduct & ProductConfigurationDTO;

export interface ProductOptionSelection {
  groupId: string;
  optionIds: string[];
}
