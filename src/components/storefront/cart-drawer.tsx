import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { makeOrderUrl } from "@/features/cart/whatsapp";
import { formatPrice } from "@/lib/utils";
import type { CartDrawerProps, CartLineDisplayProps } from "./storefront-component.types";
import { calculateCheckout, defaultDeliveryConfiguration } from "@/features/cart/checkout";
import { CheckoutSummary } from "./checkout-summary";

export function CartDrawer({ store, catalogTypography, cart, onClose }: CartDrawerProps) {
  const [openError, setOpenError] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previousFocus?.focus();
  }, []);
  const configuration = store.delivery ?? defaultDeliveryConfiguration;
  const mode = cart.fulfillmentMode;
  const summary = calculateCheckout(cart.lines, configuration, mode);

  function checkout() {
    if (!summary.canCheckout) return;
    try {
      window.open(makeOrderUrl(store, cart.lines, mode), "_blank", "noopener,noreferrer");
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
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
          if (event.key !== "Tab") return;
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
        <div className="drawer-head">
          <div>
            <span className={`drawer-kicker ${catalogTypography ? "!text-[10px]" : ""}`}>
              {store.name}
            </span>
            <h2 id={titleId} className={catalogTypography ? "!text-[22px]" : ""}>
              Seu pedido <span>({cart.count})</span>
            </h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar carrinho">
            <X />
          </button>
        </div>
        {cart.reconciliationNotice && <p className="cart-reconciliation-notice" role="status">{cart.reconciliationNotice}</p>}
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
              <CheckoutSummary configuration={configuration} summary={summary} mode={mode} onModeChange={(next) => { cart.setFulfillmentMode(next); setOpenError(false); }} />
              <button
                className={`button checkout-button ${catalogTypography ? "!text-[13px]" : ""}`}
                style={{ background: store.accent }}
                onClick={checkout}
                disabled={!summary.canCheckout}
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
