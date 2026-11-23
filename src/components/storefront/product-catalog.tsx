import { CategoryFilter } from "./category-filter";
import { ProductGrid } from "./product-grid";
import { ProductSearch } from "./product-search";
import type { StoreDemo, StoreProduct } from "@/types/store.types";
import type { AddStoreProduct, StoreCartController } from "./storefront-component.types";
import { resolveProductEmptyState, resolveStorefrontCopy } from "./storefront-copy";

interface ProductCatalogProps {
  cart: StoreCartController;
  store: StoreDemo;
  products: StoreProduct[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onAdd: AddStoreProduct;
  onSelectProduct: (product: StoreProduct) => void;
  isDemo?: boolean;
  onClearFilters: () => void;
}

export function ProductCatalog({
  cart,
  store,
  products,
  selectedCategory,
  onSelectCategory,
  query,
  onQueryChange,
  onAdd,
  onSelectProduct,
  isDemo = false,
  onClearFilters,
}: ProductCatalogProps) {
  const catalog = store.type === "CATALOG";
  const copy = resolveStorefrontCopy(store, isDemo);
  const emptyState = resolveProductEmptyState(store.products.length, Boolean(query.trim()) || selectedCategory !== "todos");

  return (
    <section className="product-section" id="produtos">
      <div className="product-section-heading">
        <div>
          {copy.productEyebrow && (
            <span className={`section-eyebrow ${catalog ? "!text-[9px] md:!text-[11px]" : ""}`}>
              {copy.productEyebrow}
            </span>
          )}
          <h2 className={catalog ? "!text-[23px] md:!text-[26px] lg:!text-[28px]" : ""}>
            {copy.productTitle}
          </h2>
        </div>
        <ProductSearch
          catalogTypography={catalog}
          query={query}
          onQueryChange={onQueryChange}
        />
      </div>
      <CategoryFilter
        categories={store.categories}
        catalogTypography={catalog}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      <ProductGrid
        cart={cart}
        products={products}
        catalogTypography={catalog}
        accent={store.accent}
        emptyMessage={emptyState.message}
        showClearFilters={emptyState.showClearFilters}
        onAdd={onAdd}
        onSelect={onSelectProduct}
        onClearFilters={onClearFilters}
      />
    </section>
  );
}
