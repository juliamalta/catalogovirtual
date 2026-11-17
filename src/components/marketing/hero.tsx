import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  MessageCircle,
  MousePointer2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { StoreDemo, StoreProduct } from "@/types/store.types";
import { formatPrice } from "@/lib/utils";
import type { HeroProps } from "./hero.types";

function HeroPreview({ store }: { store: StoreDemo }) {
  const [firstProduct, secondProduct] = store.products;
  const categories = store.categories.slice(0, 3);
  const totalCents = (firstProduct?.priceCents ?? 0) + (secondProduct?.priceCents ?? 0);

  return (
    <div className="hero-visual" aria-label={`Prévia demonstrativa da loja ${store.name}`}>
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <div className="preview-window">
        <div className="preview-toolbar">
          <span className="window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="preview-url">
            <span /> {store.slug}.catalogolojavirtual.com.br
          </span>
          <span className="preview-menu">···</span>
        </div>
        <div className="preview-store">
          <div className="preview-cover" style={{ backgroundImage: `url(${store.cover})` }} />
          <div className="preview-profile">
            <div className="preview-avatar">{store.logo}</div>
            <div className="preview-store-name">
              {store.name} <span>✿</span>
            </div>
            <div className="preview-tagline">{store.tagline}</div>
          </div>
          <div className="preview-category">
            {categories.map((category) => (
              <span key={category.id}>{category.name}</span>
            ))}
          </div>
          <div className="preview-products">
            {[firstProduct, secondProduct].filter(isStoreProduct).map((product) => (
              <PreviewProduct key={product.id} product={product} />
            ))}
          </div>
          <div className="preview-cart">
            <span>
              <span className="cart-bubble">2</span> Ver meu pedido
            </span>
            <b>
              {formatPrice(totalCents)} <ArrowRight size={14} />
            </b>
          </div>
        </div>
      </div>
      <div className="float-card whatsapp-float">
        <span>
          <MessageCircle size={17} />
        </span>
        <div>
          <b>Pedido pronto para enviar</b>
          <small>O cliente continua no WhatsApp</small>
        </div>
        <Check size={15} />
      </div>
      <div className="float-card link-float">
        <span className="link-spark">
          <WandSparkles size={17} />
        </span>
        <div>
          <b>Um link para compartilhar</b>
          <small>catalogolojavirtual.com.br/sua-loja</small>
        </div>
      </div>
      <div className="cursor-badge" aria-hidden="true">
        <MousePointer2 size={16} />
      </div>
    </div>
  );
}

function isStoreProduct(product: StoreProduct | undefined): product is StoreProduct {
  return product !== undefined;
}

function PreviewProduct({ product }: { product: StoreProduct }) {
  return (
    <div className="preview-product">
      <div className="mini-product-image" style={{ backgroundImage: `url(${product.image})` }} />
      <b>{product.name}</b>
      <small>{formatPrice(product.priceCents)}</small>
    </div>
  );
}

export function Hero({
  title,
  description,
  primaryHref,
  secondaryHref,
  sampleStore,
}: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <Sparkles size={13} />
            </span>
            SUA LOJA ONLINE, DO SEU JEITO
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="hero-buttons">
            <Link className="button button-purple" href={primaryHref}>
              Criar minha loja <ArrowRight size={17} />
            </Link>
            <a className="text-link" href={secondaryHref}>
              Ver demonstração <ArrowDown size={15} />
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-icons" aria-hidden="true">
              <span>🍰</span>
              <span>👗</span>
              <span>🌿</span>
            </div>
            <span>
              Para diferentes negócios. <strong>Com a sua identidade.</strong>
            </span>
          </div>
        </div>
        <HeroPreview store={sampleStore} />
      </div>
      <div className="hero-bottom container">
        <span>FEITA PARA QUEM FAZ ACONTECER</span>
        <div>
          <i>✳</i> Pequenos negócios <i>✳</i> Novos começos <i>✳</i> Boas ideias
        </div>
        <a href="#formatos">
          Explore a plataforma <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}
