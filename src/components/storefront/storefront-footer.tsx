import { Brand } from "@/components/brand";
import type { StorefrontStoreProps } from "./storefront-component.types";

export function StorefrontFooter({ store }: StorefrontStoreProps) {
  return (
    <footer className="store-footer">
      <span className="store-footer-mark">✳</span>
      <span>{store.name}</span>
      <i>feito com carinho</i>
      <b>
        <Brand /> <span>com Catálogo Loja Virtual</span>
      </b>
    </footer>
  );
}
