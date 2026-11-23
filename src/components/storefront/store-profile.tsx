import type { StorefrontStoreProps } from "./storefront-component.types";
import { StoreLogo } from "./store-logo";
import { resolveStorefrontCopy } from "./storefront-copy";
import type { StoreOperatingStatus } from "@/types/business-hours.types";

export function StoreProfile({ store, isDemo = false }: StorefrontStoreProps) {
  const catalog = store.type === "CATALOG";
  const copy = resolveStorefrontCopy(store, isDemo);
  const operatingStatus: StoreOperatingStatus = store.operatingStatus ?? {
    state: "UNKNOWN",
    label: "Horário não informado",
    detail: null,
  };
  return (
    <div className="store-profile">
      <StoreLogo store={store} className="store-profile-logo" />
      <div>
        <div className={`store-profile-name ${catalog ? "!text-sm md:!text-base" : ""}`}>
          {store.name}
        </div>
        {store.description.trim() && <div className={`store-profile-tagline ${catalog ? "!text-[11px] md:!text-xs" : ""}`}>
          {store.description}
        </div>}
      </div>
      {copy.profileStatus && isDemo && <span className={`store-open-badge ${catalog ? "!text-[10px] md:!text-xs" : ""}`}>
        <span /> {copy.profileStatus}
      </span>}
      {!isDemo && <span className={`store-open-badge store-business-status is-${operatingStatus.state.toLowerCase()}`} role="status">
        <i className="business-status-dot" aria-hidden="true" />
        <span className="business-status-copy">
          <strong>{operatingStatus.label}</strong>
          {operatingStatus.detail && <small>{operatingStatus.detail}</small>}
        </span>
      </span>}
    </div>
  );
}
