import type { StorefrontStoreProps } from "./storefront-component.types";

export function StoreAbout({ store, isPreview = false }: StorefrontStoreProps) {
  return (
    <section className="store-about" id="sobre-loja">
      {!isPreview && <span className="about-star">✳</span>}
      <div>
        <span className="section-eyebrow">{isPreview ? "SOBRE A LOJA" : "UM POUCO SOBRE NÓS"}</span>
        <h2>{isPreview ? store.name : <>Pequenos detalhes.<br /><em>Grandes momentos.</em></>}</h2>
        <p>{isPreview ? store.description : `${store.description} Cada escolha é feita pensando em deixar um pedacinho do nosso mundo na sua casa.`}</p>
        {!isPreview && <span className="about-signature">Com carinho, {store.name}</span>}
      </div>
      <div className="about-photo" style={{ backgroundImage: `url(${store.cover})` }} />
    </section>
  );
}
