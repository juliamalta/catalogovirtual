import React from "react";
import { Minus, Plus } from "lucide-react";
import { requiresProductSelection } from "@/features/cart/product-selection";
import { formatPrice } from "@/lib/utils";
import type { ProductCardProps } from "./storefront-component.types";

export function ProductCard({ cart, catalogTypography, product, accent, onAdd, onSelect }: ProductCardProps) {
  const configurable = requiresProductSelection(product);
  const lines = cart.lines.filter((line) => line.product.id === product.id);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const lastLine = lines[lines.length - 1];
  return (
    <article className="product-card">
      {product.image && <button
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
      </button>}
      <div className="product-info">
        <button
          className={`product-title ${catalogTypography ? "!text-xs md:!text-[13px]" : ""}`}
          onClick={() => onSelect(product)}
        >
          {product.name}
        </button>
        {product.description && <p className={catalogTypography ? "!text-[10px] !leading-[1.4] md:!text-xs md:!leading-[1.45]" : ""}>
          {product.description}
        </p>}
        <div className="product-bottom">
          <strong className={catalogTypography ? "!text-[11px] md:!text-[13px]" : ""}>
            {formatPrice(product.priceCents)}
          </strong>
          <div className="product-card-controls" role="group" aria-label={`Quantidade de ${product.name}`}>
            {!configurable && quantity > 0 && <>
              <button type="button" className="add-product" aria-label={`Diminuir quantidade de ${product.name}`}
                onClick={() => cart.setQuantity(lastLine.key, lastLine.quantity - 1)}><Minus size={17} /></button>
              <span className="product-card-quantity" aria-label={`${quantity} no pedido`}>{quantity}</span>
            </>}
            <button
              type="button"
              className={configurable ? "choose-product-options" : "add-product"}
              style={{ "--store-accent": accent } as React.CSSProperties}
              onClick={() => (configurable ? onSelect(product) : onAdd(product))}
              disabled={product.unavailable}
              aria-label={configurable ? `Escolher opções de ${product.name}` : `Adicionar ${product.name}`}
            >
              {configurable ? "Escolher opções" : <Plus size={17} />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
