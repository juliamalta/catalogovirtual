import { Brand } from "@/components/brand";
import type { StorefrontStoreProps } from "./storefront-component.types";
import { resolveStorefrontCopy } from "./storefront-copy";

export function StorefrontFooter({ store, isDemo = false }: StorefrontStoreProps) {
  const copy = resolveStorefrontCopy(store, isDemo);
  return (
    <footer className="store-footer">
      <span className="store-footer-mark">✳</span>
      <span>{store.name}</span>
      {copy.footerSignature && <i>{copy.footerSignature}</i>}
      <b>
        <Brand /> <span>com Catálogo Loja Virtual</span>
      </b>
    </footer>
  );
}
