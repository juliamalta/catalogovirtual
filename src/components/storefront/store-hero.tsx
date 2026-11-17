import { ArrowRight, Clock3 } from "lucide-react";
import type { StorefrontStoreProps } from "./storefront-component.types";

export function StoreHero({ store, isPreview = false }: StorefrontStoreProps) {
  const showcase = store.type === "SHOWCASE";
  const catalog = store.type === "CATALOG";
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
          <span className="showcase-eyebrow">{isPreview ? "SUA LOJA" : "OBJETOS PARA VIVER BEM"}</span>
          <h1>{store.tagline}</h1>
          <p>{store.subtitle || store.description}</p>
          <a className="button showcase-button" href="#produtos">
            Descobrir coleção <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <div className="store-hero-copy">
          {!isPreview && <span className={`store-open ${catalog ? "!text-[12px] sm:!text-[13px] md:!text-sm" : ""}`}>
            <i /> Loja aberta hoje <span>·</span> <Clock3 size={13} /> 9h–18h
          </span>}
          <h1 className={catalogTypography}>{store.tagline}</h1>
          <p className={catalog ? "!text-xs sm:!text-[13px] md:!text-sm" : undefined}>
            {store.subtitle || store.description}
          </p>
          <a
            className={`store-hero-cta ${catalog ? "!text-xs sm:!text-[13px] md:!text-sm" : ""}`}
            href="#produtos"
          >
            Conheça nossos produtos <ArrowRight size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
