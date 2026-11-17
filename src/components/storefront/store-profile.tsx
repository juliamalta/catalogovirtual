import type { StorefrontStoreProps } from "./storefront-component.types";
import { StoreLogo } from "./store-logo";

export function StoreProfile({ store }: StorefrontStoreProps) {
  const catalog = store.type === "CATALOG";
  return (
    <div className="store-profile">
      <StoreLogo store={store} className="store-profile-logo" />
      <div>
        <div className={`store-profile-name ${catalog ? "!text-sm md:!text-base" : ""}`}>
          {store.name}
        </div>
        <div className={`store-profile-tagline ${catalog ? "!text-[11px] md:!text-xs" : ""}`}>
          {store.description}
        </div>
      </div>
      <span className={`store-open-badge ${catalog ? "!text-[10px] md:!text-xs" : ""}`}>
        <span /> Disponível
      </span>
    </div>
  );
}
