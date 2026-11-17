import type { useCart } from "@/hooks/use-cart";
import type { CartLine, StoreCategory, StoreDemo, StoreProduct, StorefrontType } from "@/types/store.types";

export type StoreCartController = ReturnType<typeof useCart>;
export type AddStoreProduct = (product: StoreProduct, option?: string, note?: string) => void;

export interface StorefrontHeaderProps {
  store: StoreDemo;
  cartCount: number;
  onOpenCart: () => void;
}

export interface StorefrontStoreProps {
  store: StoreDemo;
  isPreview?: boolean;
}

export interface StorefrontRibbonProps {
  storefrontType: StorefrontType;
}

export interface CategoryFilterProps {
  catalogTypography: boolean;
  categories: StoreCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export interface ProductSearchProps {
  catalogTypography: boolean;
  query: string;
  onQueryChange: (query: string) => void;
}

export interface ProductCardProps {
  catalogTypography: boolean;
  product: StoreProduct;
  accent: string;
  onAdd: AddStoreProduct;
  onSelect: (product: StoreProduct) => void;
}

export interface ProductGridProps {
  catalogTypography: boolean;
  products: StoreProduct[];
  accent: string;
  onAdd: AddStoreProduct;
  onSelect: (product: StoreProduct) => void;
  onClearFilters: () => void;
}

export interface FloatingCartButtonProps {
  catalogTypography: boolean;
  cartCount: number;
  totalCents: number;
  onOpenCart: () => void;
}

export interface CartDrawerProps {
  store: StoreDemo;
  catalogTypography: boolean;
  cart: StoreCartController;
  onClose: () => void;
}

export interface ProductModalProps {
  product: StoreProduct;
  accent: string;
  catalogTypography: boolean;
  onClose: () => void;
  onAdd: AddStoreProduct;
}

export interface CartLineDisplayProps {
  catalogTypography: boolean;
  line: CartLine;
  cart: StoreCartController;
}
