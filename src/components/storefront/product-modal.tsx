import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProductModalProps } from "./storefront-component.types";

export function ProductModal({
  product,
  accent,
  catalogTypography,
  onClose,
  onAdd,
}: ProductModalProps) {
  const [option, setOption] = useState(product.options?.[0] ?? "");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const productImages = product.images?.length ? product.images : product.image ? [product.image] : [];
  const [activeImage, setActiveImage] = useState(productImages[0] ?? "");

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="product-modal">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X />
        </button>
        <div className="modal-image" style={{ backgroundImage: activeImage ? `url(${activeImage})` : undefined }} />
        {productImages.length > 1 && <div className="flex gap-2 overflow-x-auto px-5 pt-3" aria-label="Outras imagens do produto">
          {productImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(image)} aria-label={`Ver imagem ${index + 1}`} aria-pressed={activeImage === image} className={`h-14 w-16 shrink-0 rounded-lg border-2 bg-cover bg-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${activeImage === image ? "border-[#7351d6]" : "border-transparent hover:border-[#d7cbe9]"}`} style={{ backgroundImage: `url(${image})` }} />)}
        </div>}
        <div className="modal-content">
          <span className="modal-category">{product.category}</span>
          <h2 className={catalogTypography ? "!text-[26px]" : ""}>{product.name}</h2>
          <p className={catalogTypography ? "!text-xs" : ""}>{product.description}</p>
          {product.options && (
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
                  {product.options.map((productOption) => (
                    <option key={productOption}>{productOption}</option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          )}
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
            {formatPrice(product.priceCents)}
          </div>
          <button
            className={`button modal-add ${catalogTypography ? "!text-xs" : ""}`}
            style={{ background: accent }}
            onClick={() => {
              onAdd(product, option || undefined, note);
              setAdded(true);
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
