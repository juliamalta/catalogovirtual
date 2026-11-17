import { Search } from "lucide-react";
import type { ProductGridProps } from "./storefront-component.types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  catalogTypography,
  accent,
  onAdd,
  onSelect,
  onClearFilters,
}: ProductGridProps) {
  return (
    <div className="store-products-grid">
      {products.map((product) => (
        <ProductCard
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
          <p>Nenhum produto encontrado por aqui.</p>
          <button onClick={onClearFilters}>Limpar busca</button>
        </div>
      )}
    </div>
  );
}
