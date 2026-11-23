import { ArrowRight } from "lucide-react";
import type { StorefrontStoreProps } from "./storefront-component.types";
import { resolveStorefrontCopy } from "./storefront-copy";

export function StoreHero({ store, isPreview = false, isDemo = false }: StorefrontStoreProps) {
  const showcase = store.type === "SHOWCASE";
  const catalog = store.type === "CATALOG";
  const copy = resolveStorefrontCopy(store, isDemo);
  const catalogTypography = catalog
    ? "!text-[30px] sm:!text-[34px] md:!text-[38px] lg:!text-[42px]"
    : "";

  return (
    <div
      id="top"
      className={`store-hero ${showcase ? "showcase-hero" : ""}`}
      style={{
        backgroundImage: store.cover
          ? `linear-gradient(90deg,rgba(21,20,17,.58),rgba(21,20,17,.04)),url("${store.cover}")`
          : `linear-gradient(120deg,${store.accent},${store.background})`,
      }}
    >
      {showcase ? (
        <div className="store-hero-copy showcase-copy">
          {copy.heroEyebrow && <span className="showcase-eyebrow">{isPreview ? "SUA LOJA" : copy.heroEyebrow}</span>}
          <h1>{copy.heroTitle}</h1>
          {copy.heroSubtitle && <p>{copy.heroSubtitle}</p>}
          <a className="button showcase-button" href="#produtos">
            {copy.heroAction} <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <div className="store-hero-copy">
          {!isPreview && copy.heroStatus && <span className={`store-open ${catalog ? "!text-[12px] sm:!text-[13px] md:!text-sm" : ""}`}>
            <i /> {copy.heroStatus}
          </span>}
          {!isDemo && copy.heroEyebrow && <span className="store-open store-hero-type">{copy.heroEyebrow}</span>}
          <h1 className={catalogTypography}>{copy.heroTitle}</h1>
          {copy.heroSubtitle && <p className={catalog ? "!text-xs sm:!text-[13px] md:!text-sm" : undefined}>{copy.heroSubtitle}</p>}
          <a
            className={`store-hero-cta ${catalog ? "!text-xs sm:!text-[13px] md:!text-sm" : ""}`}
            href="#produtos"
          >
            {copy.heroAction} <ArrowRight size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
