import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProductModalProps } from "./storefront-component.types";
import { resolveCartAddition } from "@/features/cart/product-selection";

export function ProductModal({
  product,
  accent,
  catalogTypography,
  onClose,
  onAdd,
}: ProductModalProps) {
  const [option, setOption] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const productImages = product.images?.length ? product.images : product.image ? [product.image] : [];
  const [activeImage, setActiveImage] = useState(productImages[0] ?? "");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previousFocus?.focus();
  }, []);
  const groups = product.configuration?.optionGroups.filter((group) => group.isActive) ?? [];
  let unitPrice: number | null = null;
  let selectionError = "";
  try {
    unitPrice = resolveCartAddition(product, option || undefined, { selections, quantity }).product.priceCents;
  } catch (cause) {
    selectionError = cause instanceof Error ? cause.message : "Confira suas escolhas.";
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`product-modal ${productImages.length ? "" : "product-modal-no-image"}`} role="dialog" aria-modal="true" aria-labelledby="product-modal-title" ref={dialog} tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key !== "Tab") return;
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, textarea, input:not(:disabled)');
          if (!controls?.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X />
        </button>
        {productImages.length > 0 && <div className="modal-image" style={{ backgroundImage: activeImage ? `url(${activeImage})` : undefined }} />}
        {productImages.length > 1 && <div className="flex gap-2 overflow-x-auto px-5 pt-3" aria-label="Outras imagens do produto">
          {productImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(image)} aria-label={`Ver imagem ${index + 1}`} aria-pressed={activeImage === image} className="h-14 w-16 shrink-0 rounded-lg border-2 border-transparent bg-cover bg-center transition hover:border-[color:var(--store-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundImage: `url(${image})`, borderColor: activeImage === image ? accent : undefined }} />)}
        </div>}
        <div className="modal-content">
          <span className="modal-category">{product.category}</span>
          <h2 id="product-modal-title" className={catalogTypography ? "!text-[26px]" : ""}>{product.name}</h2>
          <p className={catalogTypography ? "!text-xs" : ""}>{product.description}</p>
          {!product.configuration?.optionGroups.length && Boolean(product.options?.length) && (
            <div className="option-picker">
              <label className={catalogTypography ? "!text-[11px]" : ""} htmlFor="product-option">
                Escolha uma opção
              </label>
              <div className="select-wrap">
                <select
                  id="product-option"
                  className={catalogTypography ? "!text-[11px]" : ""}
                  value={option}
                  onChange={(event) => setOption(event.target.value)}
                >
                  <option value="" disabled>Selecione uma opção</option>
                  {product.options?.map((productOption) => (
                    <option key={productOption}>{productOption}</option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          )}
          {groups.map((group) => {
            const chosen = selections[group.id] ?? [];
            return <fieldset className="configuration-group" key={group.id}>
              <legend>{group.name} {group.isRequired ? "(obrigatório)" : "(opcional)"}</legend>
              <small>Escolha de {group.minSelections} a {group.maxSelections} opções.</small>
              {group.options.filter((item) => item.isActive).map((item) => {
                const checked = chosen.includes(item.id);
                return <label key={item.id} className="configuration-choice">
                  <input type={group.maxSelections === 1 ? "radio" : "checkbox"} name={`group-${group.id}`} value={item.id}
                    checked={checked}
                    disabled={!checked && group.maxSelections > 1 && chosen.length >= group.maxSelections}
                    onChange={() => {
                      setError("");
                      setSelections((current) => ({ ...current, [group.id]: group.maxSelections === 1 ? [item.id]
                        : checked ? chosen.filter((id) => id !== item.id) : [...chosen, item.id] }));
                    }} />
                  <span>{item.name}</span>
                  {item.priceCents !== null ? <small>{formatPrice(item.priceCents)}</small>
                    : item.priceDeltaCents > 0 ? <small>+ {formatPrice(item.priceDeltaCents)}</small> : null}
                </label>;
              })}
              {!group.isRequired && group.maxSelections === 1 && chosen.length > 0 &&
                <button type="button" className="configuration-clear" onClick={() => setSelections((current) => ({ ...current, [group.id]: [] }))}>Limpar escolha</button>}
            </fieldset>;
          })}
          <div className="option-picker">
            <label htmlFor="product-quantity">Quantidade</label>
            <input id="product-quantity" className="product-quantity-input" type="number" min={1} step={1} value={Number.isNaN(quantity) ? "" : quantity}
              onChange={(event) => setQuantity(event.target.valueAsNumber)} />
          </div>
          <div className="option-picker">
            <label className={catalogTypography ? "!text-[11px]" : ""} htmlFor="product-note">
              Observação (opcional)
            </label>
            <textarea
              id="product-note"
              className="product-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Algum detalhe para a loja?"
              maxLength={180}
            />
          </div>
          <div className={`modal-price ${catalogTypography ? "!text-lg" : ""}`}>
            {unitPrice !== null ? formatPrice(unitPrice * quantity) : "Selecione as opções para ver o total"}
          </div>
          {(error || selectionError) && <p className="configuration-error" role="status">{error || selectionError}</p>}
          <button
            className={`button modal-add ${catalogTypography ? "!text-xs" : ""}`}
            style={{ background: accent }}
            disabled={Boolean(selectionError)}
            onClick={() => {
              try {
                onAdd(product, option || undefined, note, { selections, quantity });
                setAdded(true);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Não foi possível adicionar o produto.");
              }
            }}
          >
            {added ? (
              <>
                <Check size={16} /> Adicionado ao pedido
              </>
            ) : (
              <>
                <Plus size={16} /> Adicionar ao pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
