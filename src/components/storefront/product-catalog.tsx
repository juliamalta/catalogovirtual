import { CategoryFilter } from "./category-filter";
import { ProductGrid } from "./product-grid";
import { ProductSearch } from "./product-search";
import type { StoreDemo, StoreProduct } from "@/types/store.types";
import type { AddStoreProduct } from "./storefront-component.types";

interface ProductCatalogProps {
  store: StoreDemo;
  products: StoreProduct[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onAdd: AddStoreProduct;
  onSelectProduct: (product: StoreProduct) => void;
  onClearFilters: () => void;
}

export function ProductCatalog({
  store,
  products,
  selectedCategory,
  onSelectCategory,
  query,
  onQueryChange,
  onAdd,
  onSelectProduct,
  onClearFilters,
}: ProductCatalogProps) {
  const showcase = store.type === "SHOWCASE";
  const catalog = store.type === "CATALOG";

  return (
    <section className="product-section" id="produtos">
      <div className="product-section-heading">
        <div>
          <span
            className={`section-eyebrow ${catalog ? "!text-[9px] md:!text-[11px]" : ""}`}
          >
            FEITO COM CARINHO, ESCOLHIDO POR VOCÊ
          </span>
          <h2 className={catalog ? "!text-[23px] md:!text-[26px] lg:!text-[28px]" : ""}>
            {showcase
              ? "Peças que contam histórias"
              : catalog
                ? "Encontre seu próximo favorito"
                : "Um docinho muda o dia"}
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
        products={products}
        catalogTypography={catalog}
        accent={store.accent}
        onAdd={onAdd}
        onSelect={onSelectProduct}
        onClearFilters={onClearFilters}
      />
    </section>
  );
}
