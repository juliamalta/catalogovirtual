import type { StorefrontStoreProps } from "./storefront-component.types";
import { resolveStorefrontCopy } from "./storefront-copy";

export function StoreAbout({ store, isPreview = false, isDemo = false }: StorefrontStoreProps) {
  const copy = resolveStorefrontCopy(store, isDemo);
  if (!copy.aboutTitle || !copy.aboutEyebrow) return null;

  return (
    <section className="store-about" id="sobre-loja">
      {!isPreview && <span className="about-star">✳</span>}
      <div>
        <span className="section-eyebrow">{copy.aboutEyebrow}</span>
        <h2>{isPreview && !isDemo ? store.name : copy.aboutTitle}</h2>
        {(isPreview && !isDemo ? store.description : copy.aboutDescription) && <p>{isPreview && !isDemo ? store.description : copy.aboutDescription}</p>}
        {!isPreview && copy.aboutSignature && <span className="about-signature">{copy.aboutSignature}</span>}
      </div>
      <div className="about-photo" style={{ backgroundImage: `url(${store.cover})` }} />
    </section>
  );
}
