import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { makeOrderUrl } from "@/features/cart/whatsapp";
import { formatPrice } from "@/lib/utils";
import type { CartDrawerProps, CartLineDisplayProps } from "./storefront-component.types";

export function CartDrawer({ store, catalogTypography, cart, onClose }: CartDrawerProps) {
  const [openError, setOpenError] = useState(false);

  function checkout() {
    try {
      window.open(makeOrderUrl(store, cart.lines), "_blank", "noopener,noreferrer");
    } catch {
      setOpenError(true);
    }
  }

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="cart-drawer" aria-label="Seu pedido">
        <div className="drawer-head">
          <div>
            <span className={`drawer-kicker ${catalogTypography ? "!text-[10px]" : ""}`}>
              {store.name}
            </span>
            <h2 className={catalogTypography ? "!text-[22px]" : ""}>
              Seu pedido <span>({cart.count})</span>
            </h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar carrinho">
            <X />
          </button>
        </div>
        {cart.lines.length > 0 ? (
          <>
            <div className="drawer-lines">
              {cart.lines.map((line) => (
                <CartLineItem
                  key={line.key}
                  catalogTypography={catalogTypography}
                  line={line}
                  cart={cart}
                />
              ))}
            </div>
            <div className="drawer-footer">
              <div className="subtotal-line">
                <span className={catalogTypography ? "!text-xs" : ""}>Total dos produtos</span>
                <b className={catalogTypography ? "!text-sm" : ""}>
                  {formatPrice(cart.totalCents)}
                </b>
              </div>
              <p>Entrega e disponibilidade combinadas diretamente com a loja.</p>
              <button
                className={`button checkout-button ${catalogTypography ? "!text-[13px]" : ""}`}
                style={{ background: store.accent }}
                onClick={checkout}
              >
                <span>Continuar pelo WhatsApp</span>
                <ArrowRight size={17} />
              </button>
              {openError && (
                <small className="form-hint">
                  Confira o número de WhatsApp configurado para esta demonstração.
                </small>
              )}
              <span className={`checkout-note ${catalogTypography ? "!text-[9px]" : ""}`}>
                Você confirma o envio da mensagem no WhatsApp.
              </span>
              <button className="clear-cart" onClick={cart.clear}>
                Limpar pedido
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <span>
              <ShoppingBag size={25} />
            </span>
            <h3>Seu pedido está vazio</h3>
            <p>Escolha algo que você goste para começar.</p>
            <button className="button button-dark" onClick={onClose}>
              Ver produtos <ArrowRight size={15} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function CartLineItem({ catalogTypography, line, cart }: CartLineDisplayProps) {
  return (
    <div className="drawer-line">
      <div className="drawer-thumb" style={{ backgroundImage: `url(${line.product.image})` }} />
      <div className="drawer-line-info">
        <b className={catalogTypography ? "!text-[13px]" : ""}>{line.product.name}</b>
        {line.option && <small className={catalogTypography ? "!text-[10px]" : ""}>{line.option}</small>}
        {line.note && <small className={catalogTypography ? "!text-[10px]" : ""}>Obs.: {line.note}</small>}
        <strong className={catalogTypography ? "!text-xs" : ""}>
          {formatPrice(line.product.priceCents * line.quantity)}
        </strong>
        <div className="quantity-control">
          <button
            onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
            aria-label="Diminuir quantidade"
          >
            <Minus size={13} />
          </button>
          <span>{line.quantity}</span>
          <button
            onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
            aria-label="Aumentar quantidade"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
