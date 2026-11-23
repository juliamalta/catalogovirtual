"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import type { StoreProduct } from "@/types/store.types";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "./cart-drawer";
import { FloatingCartButton } from "./floating-cart-button";
import { ProductCatalog } from "./product-catalog";
import { ProductModal } from "./product-modal";
import { StoreAbout } from "./store-about";
import { StorefrontFooter } from "./storefront-footer";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontRibbon } from "./storefront-ribbon";
import { StoreHero } from "./store-hero";
import { StoreProfile } from "./store-profile";
import type { AddStoreProduct, StorefrontProps } from "./storefront-component.types";

export function Storefront({ store, isPreview = false, isDemo = false }: StorefrontProps) {
  const cart = useCart(store);
  const [category, setCategory] = useState("todos");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);
  const showcase = store.type === "SHOWCASE";
  const catalog = store.type === "CATALOG";

  const filteredProducts = useMemo(
    () =>
      store.products.filter(
        (product) =>
          (category === "todos" ||
            product.category === store.categories.find((item) => item.id === category)?.name) &&
          product.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [store, category, query],
  );
  const addProduct: AddStoreProduct = (product, option, note, addition) => {
    cart.add(product, option, note, addition);
    setFeedback(`${product.name} adicionado ao pedido.`);
    setSelectedProduct(null);
  };

  return (
    <main
      className={`storefront ${showcase ? "store-showcase" : ""} ${catalog ? "store-catalog" : "store-menu"} ${isPreview ? "is-preview" : ""}`}
      style={{ "--store-accent": store.accent, "--store-bg": store.background } as React.CSSProperties}
    >
      {isPreview ? <div className="store-preview-ribbon"><Eye size={14} /> Prévia privada da loja · não altera a versão pública</div> : <StorefrontRibbon storefrontType={store.type} isDemo={isDemo} />}
      <StorefrontHeader
        store={store}
        cartCount={cart.count}
        onOpenCart={() => setCartOpen(true)}
      />
      <StoreHero store={store} isPreview={isPreview} isDemo={isDemo} />
      <div className="store-body">
        <StoreProfile store={store} isDemo={isDemo} />
        {cart.reconciliationNotice && !cartOpen && <p className="cart-reconciliation-notice" role="status">{cart.reconciliationNotice}</p>}
        <ProductCatalog
          cart={cart}
          store={store}
          products={filteredProducts}
          selectedCategory={category}
          onSelectCategory={setCategory}
          query={query}
          onQueryChange={setQuery}
          onAdd={addProduct}
          onSelectProduct={setSelectedProduct}
          isDemo={isDemo}
          onClearFilters={() => {
            setQuery("");
            setCategory("todos");
          }}
        />
        <StoreAbout store={store} isPreview={isPreview} isDemo={isDemo} />
        <StorefrontFooter store={store} isDemo={isDemo} />
      </div>
      <FloatingCartButton
        catalogTypography={catalog}
        cartCount={cart.count}
        totalCents={cart.totalCents}
        onOpenCart={() => setCartOpen(true)}
      />
      <div className={feedback && !cartOpen ? "cart-feedback" : "sr-only"} role="status" aria-live="polite" aria-atomic="true">{feedback}</div>
      {cartOpen && (
        <CartDrawer
          store={store}
          catalogTypography={catalog}
          cart={cart}
          onClose={() => setCartOpen(false)}
        />
      )}
      {selectedProduct && (
        <ProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          accent={store.accent}
          catalogTypography={catalog}
          onClose={() => setSelectedProduct(null)}
          onAdd={addProduct}
        />
      )}
    </main>
  );
}
