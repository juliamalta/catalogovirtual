import { Search } from "lucide-react";
import type { ProductGridProps } from "./storefront-component.types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  cart,
  products,
  catalogTypography,
  accent,
  emptyMessage,
  showClearFilters,
  onAdd,
  onSelect,
  onClearFilters,
}: ProductGridProps) {
  return (
    <div className="store-products-grid">
      {products.map((product) => (
        <ProductCard
          cart={cart}
          key={product.id}
          catalogTypography={catalogTypography}
          product={product}
          accent={accent}
          onAdd={onAdd}
          onSelect={onSelect}
        />
      ))}
      {products.length === 0 && (
        <div className="store-empty">
          <Search size={22} />
          <p>{emptyMessage}</p>
          {showClearFilters && <button onClick={onClearFilters}>Limpar busca</button>}
        </div>
      )}
    </div>
  );
}
