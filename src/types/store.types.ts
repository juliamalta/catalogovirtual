import type { StoreOperatingStatus } from "./business-hours.types";
import type { ProductConfigurationDTO, ProductType } from "./product-configuration.types";
import type { DeliveryConfiguration } from "@/features/cart/checkout";
export type StorefrontType = "MENU" | "CATALOG" | "SHOWCASE";
export type StoreMemberRole = "OWNER" | "ADMIN" | "MEMBER";
export interface StoreCategory { id: string; name: string }
export interface StoreProduct { id: string; name: string; description: string; priceCents: number; image: string; images?: string[]; category: string; badge?: string; unavailable?: boolean; options?: string[]; productType?: ProductType; configuration?: ProductConfigurationDTO }
export interface StoreDemo { delivery?: DeliveryConfiguration; slug: string; name: string; tagline: string; subtitle?: string; description: string; type: StorefrontType; whatsapp: string; accent: string; background: string; logo: string; logoUrl?: string; cover: string; categories: StoreCategory[]; products: StoreProduct[]; operatingStatus?: StoreOperatingStatus }
export interface CartLine { key: string; product: StoreProduct; quantity: number; option?: string; note?: string; selections?: Record<string, string[]> }
export interface StorePublicDTO {
  delivery: DeliveryConfiguration;
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  subtitle: string;
  type: StorefrontType;
  whatsappNumber: string;
  accent: string;
  background: string;
  logoUrl: string | null;
  coverUrl: string | null;
  categories: StoreCategory[];
  products: StoreProduct[];
  operatingStatus: StoreOperatingStatus;
}
