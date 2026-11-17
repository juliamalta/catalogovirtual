import Link from "next/link";
import { ArrowUpRight, MessageCircle, Package, ShoppingBag, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProductShowcaseProps } from "./product-showcase.types";

export function ProductShowcase({ store, href }: ProductShowcaseProps) {
  const products = store.products.slice(0, 2);
  const featuredProduct = products[0];

  return (
    <section id="experiencia" className="showcase-section section-pad">
      <div className="container showcase-grid">
        <div className="showcase-copy">
          <div className="eyebrow">UMA EXPERIÊNCIA QUE ACOMPANHA A VENDA</div>
          <h2>
            Sua loja no painel. <span>Seu cliente no celular.</span>
          </h2>
          <p>
            Cuide dos produtos e da apresentação no painel. Do outro lado, seu
            cliente navega pela loja, monta o pedido e continua a conversa pelo
            WhatsApp.
          </p>
          <div className="showcase-points">
            <ShowcasePoint
              icon={<Package size={17} />}
              title="Organize o catálogo"
              description="Produtos e categorias no painel da loja."
            />
            <ShowcasePoint
              icon={<ShoppingBag size={17} />}
              title="Deixe a escolha fluir"
              description="Uma vitrine adaptada a diferentes telas."
            />
            <ShowcasePoint
              icon={<MessageCircle size={17} />}
              title="Converse sobre o pedido"
              description="O cliente finaliza o contato no WhatsApp."
            />
          </div>
          <Link className="showcase-link" href={href}>
            Ver uma loja demonstrativa <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="showcase-stage" aria-label="Prévia ilustrativa do painel e da loja">
          <div className="showcase-panel">
            <div className="showcase-panel-top">
              <span className="showcase-panel-brand">
                <span className="showcase-panel-mark">
                  <Store size={14} />
                </span>
                Minha loja
              </span>
              <span className="showcase-panel-status">
                <i /> Publicada
              </span>
            </div>
            <div className="showcase-panel-body">
              <div className="showcase-panel-heading">
                <div>
                  <small>VISÃO GERAL</small>
                  <b>{store.name}</b>
                </div>
                <span className="showcase-panel-action">Visualizar loja ↗</span>
              </div>
              <div className="showcase-panel-summary">
                <span>
                  <small>Produtos</small>
                  <b>Seu catálogo</b>
                </span>
                <span>
                  <small>Apresentação</small>
                  <b>Catálogo Online</b>
                </span>
              </div>
              <div className="showcase-list-label">ADICIONADOS À LOJA</div>
              {products.map((product, index) => (
                <div className="showcase-product-row" key={product.id}>
                  <span
                    className={`showcase-thumb showcase-thumb-${index + 1}`}
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                  <span>
                    <b>{product.name}</b>
                    <small>{product.category}</small>
                  </span>
                  <strong>{formatPrice(product.priceCents)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-phone">
            <div className="showcase-phone-notch" />
            <div className="showcase-phone-image" style={{ backgroundImage: `url(${store.cover})` }} />
            <div className="showcase-phone-content">
              <span className="showcase-phone-kicker">{store.name}</span>
              <b>{store.tagline}</b>
              {featuredProduct && (
                <>
                  <span
                    className="showcase-phone-product"
                    style={{ backgroundImage: `url(${featuredProduct.image})` }}
                  />
                  <span className="showcase-phone-product-name">
                    {featuredProduct.name}
                    <strong>{formatPrice(featuredProduct.priceCents)}</strong>
                  </span>
                </>
              )}
              <span className="showcase-phone-button">
                <ShoppingBag size={12} /> Adicionar ao pedido
              </span>
            </div>
            <div className="showcase-whatsapp">
              <span>
                <MessageCircle size={14} />
              </span>
              <span>
                <b>Pedido encaminhado</b>
                <small>Continue a conversa com a loja</small>
              </span>
              <ArrowUpRight size={14} />
            </div>
          </div>
          <span className="showcase-caption">PRÉVIA ILUSTRATIVA DA PLATAFORMA</span>
        </div>
      </div>
    </section>
  );
}

function ShowcasePoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="showcase-point-icon">{icon}</span>
      <span>
        <b>{title}</b>
        <small>{description}</small>
      </span>
    </div>
  );
}
