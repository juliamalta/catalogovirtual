import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { FloatingCartButtonProps } from "./storefront-component.types";

export function FloatingCartButton({
  catalogTypography,
  cartCount,
  totalCents,
  onOpenCart,
}: FloatingCartButtonProps) {
  return (
    <button className={`floating-cart ${catalogTypography ? "!text-xs" : ""}`} onClick={onOpenCart} aria-label="Abrir meu pedido">
      <ShoppingBag size={17} />
      <span>Meu pedido</span>
      {cartCount > 0 && <i>{cartCount}</i>}
      <b className={catalogTypography ? "!text-xs" : ""}>
        {cartCount > 0 ? formatPrice(totalCents) : ""}
      </b>
    </button>
  );
}
