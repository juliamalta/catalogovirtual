import { RefreshCw, Star, Trash2 } from "lucide-react";
import type { ProductImageSlot } from "@/features/images/image-storage.types";

interface ProductImagePreviewProps {
  image: ProductImageSlot;
  index: number;
  isPrimary: boolean;
  disabled: boolean;
  onRemove: () => void;
  onReplace: () => void;
  onMakePrimary: () => void;
}

export function ProductImagePreview({ image, index, isPrimary, disabled, onRemove, onReplace, onMakePrimary }: ProductImagePreviewProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      <div role="img" aria-label={image.altText || `Imagem ${index + 1} do produto`} className="relative aspect-[4/3] bg-canvas bg-cover bg-center" style={{ backgroundImage: `url("${image.imageUrl}")` }}>
        {image.status === "uploading" && (
          <div className="absolute inset-0 flex flex-col justify-end bg-black/45 p-3 text-white">
            <span className="mb-2 text-xs font-medium">Enviando {image.progress ?? 0}%</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/30"><span className="block h-full rounded-full bg-white transition-[width]" style={{ width: `${image.progress ?? 0}%` }} /></span>
          </div>
        )}
        {image.status === "error" && <span className="absolute inset-x-2 bottom-2 rounded-md bg-error/90 px-2 py-1 text-center text-[11px] text-white">Falha ao enviar</span>}
        {isPrimary && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-brand-hover shadow-sm"><Star size={12} fill="currentColor" /> Principal</span>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-line p-2">
        {!isPrimary && <button type="button" disabled={disabled} onClick={onMakePrimary} className="rounded-md px-2 py-1 text-[11px] font-medium text-ink-secondary hover:bg-brand-soft hover:text-brand disabled:opacity-50">Tornar principal</button>}
        {isPrimary && <span className="px-2 py-1 text-[11px] text-ink-secondary">Foto {index + 1}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" disabled={disabled} onClick={onReplace} aria-label={`Substituir imagem ${index + 1}`} title="Substituir" className="grid h-8 w-8 place-items-center rounded-lg text-ink-secondary hover:bg-brand-soft hover:text-brand disabled:opacity-50"><RefreshCw size={15} /></button>
          <button type="button" disabled={disabled} onClick={onRemove} aria-label={`Remover imagem ${index + 1}`} title="Remover" className="grid h-8 w-8 place-items-center rounded-lg text-ink-secondary hover:bg-error-soft hover:text-error disabled:opacity-50"><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  );
}
