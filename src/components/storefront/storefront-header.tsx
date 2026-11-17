import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { StorefrontHeaderProps } from "./storefront-component.types";
import { StoreLogo } from "./store-logo";

export function StorefrontHeader({ store, cartCount, onOpenCart }: StorefrontHeaderProps) {
  const catalog = store.type === "CATALOG";
  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Link className={`store-brand ${catalog ? "!text-lg md:!text-xl lg:!text-[21px]" : ""}`} href="#top">
          <StoreLogo store={store} className="store-logo" />
          {store.name}
        </Link>
        <div className="store-header-links">
          <a href="#produtos" className={catalog ? "!text-sm" : undefined}>
            Produtos
          </a>
          <a href="#sobre-loja" className={catalog ? "!text-sm" : undefined}>
            Sobre
          </a>
          <button
            className={`store-cart-button ${catalog ? "!text-sm" : ""}`}
            onClick={onOpenCart}
            aria-label={`Abrir pedido. ${cartCount} itens`}
          >
            <ShoppingBag size={17} />
            <span>Meu pedido</span>
            {cartCount > 0 && <i>{cartCount}</i>}
          </button>
        </div>
      </div>
    </header>
  );
}
