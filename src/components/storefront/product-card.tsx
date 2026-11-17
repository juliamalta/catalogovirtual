import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProductCardProps } from "./storefront-component.types";

export function ProductCard({ catalogTypography, product, accent, onAdd, onSelect }: ProductCardProps) {
  return (
    <article className="product-card">
      <button
        className="product-image-button"
        onClick={() => onSelect(product)}
        aria-label={`Ver ${product.name}`}
      >
        <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
          {product.badge && (
            <span className={`product-badge ${catalogTypography ? "!text-[9px] md:!text-[10px]" : ""}`}>
              {product.badge}
            </span>
          )}
          {product.unavailable && <span className="unavailable">Indisponível</span>}
        </div>
      </button>
      <div className="product-info">
        <button
          className={`product-title ${catalogTypography ? "!text-xs md:!text-[13px]" : ""}`}
          onClick={() => onSelect(product)}
        >
          {product.name}
        </button>
        <p className={catalogTypography ? "!h-[30px] !text-[10px] !leading-[1.4] md:!h-[35px] md:!text-xs md:!leading-[1.45]" : ""}>
          {product.description}
        </p>
        <div className="product-bottom">
          <strong className={catalogTypography ? "!text-[11px] md:!text-[13px]" : ""}>
            {formatPrice(product.priceCents)}
          </strong>
          <button
            className="add-product"
            style={{ "--store-accent": accent } as React.CSSProperties}
            onClick={() => (product.options ? onSelect(product) : onAdd(product))}
            disabled={product.unavailable}
            aria-label={`Adicionar ${product.name}`}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
