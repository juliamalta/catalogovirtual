import React from "react";
import Link from "next/link";
import { Image as ImageIcon, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductActionsMenu } from "./product-actions-menu";

export interface DashboardProductItem {
  id: string; name: string; imageUrl: string; priceCents: number;
  categoryName: string | null; isActive: boolean; isFeatured: boolean;
  onToggle: () => Promise<void>; onRemove: () => Promise<void>;
}
export function DashboardProductGrid({ storeSlug, products }: { storeSlug: string; products: DashboardProductItem[] }) {
  return <ul className="admin-product-grid" aria-label="Produtos da loja">
    {products.map((product) => <li className="admin-product-card" key={product.id}>
      <div className="admin-product-card-body">
        <span className="admin-product-image" role="img" aria-label={product.imageUrl ? `Foto de ${product.name}` : "Produto sem foto"} style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}>
          {!product.imageUrl && <ImageIcon size={25} strokeWidth={1.4} aria-hidden="true" />}
        </span>
        <div className="admin-product-description"><h2><Link href={`/painel/${storeSlug}/produtos/${product.id}`}>{product.name}</Link></h2><p>{product.categoryName || "Sem categoria"}</p><strong>{formatPrice(product.priceCents)}</strong></div>
      </div>
      <div className="admin-product-card-footer">
        <span className={`admin-product-state ${product.isActive ? "is-visible" : ""}`}><i aria-hidden="true" />{product.isActive ? "Visível" : "Oculto"}</span>
        {product.isFeatured && <span className="admin-product-featured">Destaque</span>}
        <Link className="admin-product-edit" href={`/painel/${storeSlug}/produtos/${product.id}`} aria-label={`Editar ${product.name}`}><Pencil size={14} aria-hidden="true" />Editar</Link>
        <ProductActionsMenu name={product.name} isActive={product.isActive} onToggle={product.onToggle} onRemove={product.onRemove} />
      </div>
    </li>)}
  </ul>;
}
