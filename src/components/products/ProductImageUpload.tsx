"use client";

import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type DragEvent, type SetStateAction } from "react";
import { ImagePlus } from "lucide-react";
import { makeProductImagePrimaryAction, removeProductImageAction } from "@/app/painel/actions";
import { MAX_PRODUCT_IMAGE_SIZE, MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_MIME_TYPES, type ProductImageSlot } from "@/features/images/image-storage.types";
import { matchesImageSignature } from "@/features/images/validations";
import { ProductImageGallery } from "./ProductImageGallery";

interface ProductImageUploadProps {
  images: ProductImageSlot[];
  onImagesChange: Dispatch<SetStateAction<ProductImageSlot[]>>;
  storeSlug: string;
  productId?: string;
  blobConfigured: boolean;
  disabled: boolean;
  showHeading?: boolean;
}

function revokeLocalPreview(image: ProductImageSlot) {
  if (image.file && image.imageUrl.startsWith("blob:")) URL.revokeObjectURL(image.imageUrl);
}

export function ProductImageUpload({ images, onImagesChange, storeSlug, productId, blobConfigured, disabled, showHeading = true }: ProductImageUploadProps) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef(new Map<string, HTMLInputElement>());
  const latestImages = useRef(images);
  const [dragging, setDragging] = useState(false);
  const [busyImageKey, setBusyImageKey] = useState<string>();
  const [message, setMessage] = useState<string>();

  latestImages.current = images;
  useEffect(() => () => latestImages.current.forEach(revokeLocalPreview), []);

  async function validImageFile(file: File) {
    if (!(PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return "Use imagens JPG, PNG ou WebP.";
    if (file.size < 1 || file.size > MAX_PRODUCT_IMAGE_SIZE) return "Cada imagem pode ter no máximo 5 MB.";
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!matchesImageSignature(file.type, signature)) return "O conteúdo do arquivo não corresponde ao formato da imagem.";
    return undefined;
  }

  async function addFiles(fileList: FileList | File[], replaceKey?: string) {
    setMessage(undefined);
    const files = Array.from(fileList);
    if (!files.length) return;
    const replaceImage = replaceKey ? images.find((image) => image.key === replaceKey) : undefined;
    const available = replaceImage ? 1 : Math.max(0, MAX_PRODUCT_IMAGES - images.length);
    if (available === 0) {
      setMessage("Cada produto pode ter até cinco imagens.");
      return;
    }
    if (files.length > available) setMessage(`Você pode adicionar até ${available} ${available === 1 ? "imagem" : "imagens"} neste momento.`);

    const accepted: ProductImageSlot[] = [];
    for (const file of files.slice(0, available)) {
      const error = await validImageFile(file);
      if (error) {
        setMessage(error);
        continue;
      }
      const key = replaceImage?.key ?? crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      if (replaceImage?.file) revokeLocalPreview(replaceImage);
      accepted.push({
        key,
        imageUrl: previewUrl,
        originalImageUrl: replaceImage?.originalImageUrl ?? replaceImage?.imageUrl,
        imageId: replaceImage?.imageId,
        replaceImageId: replaceImage?.imageId,
        file,
        altText: file.name,
        status: "pending",
        progress: 0
      });
    }

    if (!accepted.length) return;
    if (replaceImage) {
      const replacement = accepted[0];
      onImagesChange((current) => current.map((image) => image.key === replaceKey ? replacement : image));
    } else {
      onImagesChange((current) => [...current, ...accepted]);
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  }

  function onReplaceInput(key: string, event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files, key);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled && blobConfigured) void addFiles(event.dataTransfer.files);
  }

  async function removeImage(key: string) {
    setMessage(undefined);
    const image = images.find((item) => item.key === key);
    if (!image) return;
    if (!image.imageId) {
      revokeLocalPreview(image);
      onImagesChange((current) => current.filter((item) => item.key !== key));
      return;
    }
    if (!productId) return;
    if (image.file && image.replaceImageId) {
      revokeLocalPreview(image);
      onImagesChange((current) => current.map((item) => item.key === key ? {
        ...item,
        imageUrl: item.originalImageUrl ?? item.imageUrl,
        file: undefined,
        replaceImageId: undefined,
        status: "uploaded",
        progress: undefined,
        error: undefined
      } : item));
      return;
    }

    setBusyImageKey(key);
    const result = await removeProductImageAction(storeSlug, productId, image.imageId);
    setBusyImageKey(undefined);
    if (!result.success) {
      setMessage(result.error || "Não foi possível remover a imagem.");
      return;
    }
    onImagesChange((current) => current.filter((item) => item.key !== key));
  }

  async function makePrimary(key: string) {
    const index = images.findIndex((image) => image.key === key);
    if (index <= 0) return;
    const image = images[index];
    if (productId && image.imageId && !image.file) {
      setBusyImageKey(key);
      const result = await makeProductImagePrimaryAction(storeSlug, productId, image.imageId);
      setBusyImageKey(undefined);
      if (!result.success) {
        setMessage(result.error || "Não foi possível atualizar a foto principal.");
        return;
      }
    }
    onImagesChange((current) => {
      const position = current.findIndex((item) => item.key === key);
      if (position <= 0) return current;
      const reordered = [...current];
      const [selected] = reordered.splice(position, 1);
      reordered.unshift(selected);
      return reordered;
    });
  }

  return (
    <section aria-label={showHeading ? undefined : "Upload de imagens"} aria-labelledby={showHeading ? "product-images-title" : undefined} className="space-y-3">
      <div>
        {showHeading && <h2 id="product-images-title" className="text-sm font-semibold text-ink">Imagens do produto</h2>}
        <p className="mt-1 text-xs leading-5 text-ink-secondary">Adicione até cinco fotos. A primeira é usada como foto principal.</p>
      </div>

      {!blobConfigured && <p role="status" className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2.5 text-xs leading-5 text-warning">O Vercel Blob ainda não está configurado. O envio ficará disponível quando o armazenamento for conectado.</p>}
      {message && <p role="alert" className="rounded-lg border border-error-border bg-error-soft px-3 py-2.5 text-xs leading-5 text-error">{message}</p>}

      <div onDragEnter={(event) => { event.preventDefault(); if (!disabled && blobConfigured) setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDrop={onDrop} className={`rounded-xl border border-dashed p-4 text-center transition ${dragging ? "border-brand bg-brand-soft" : "border-line bg-canvas"}`}>
        <input aria-label="Adicionar imagens do produto" ref={addInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileInput} disabled={disabled || !blobConfigured || images.length >= MAX_PRODUCT_IMAGES} />
        <button type="button" disabled={disabled || !blobConfigured || images.length >= MAX_PRODUCT_IMAGES} onClick={() => addInputRef.current?.click()} className="mx-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:text-ink-secondary">
          <ImagePlus size={17} /> Escolher imagens
        </button>
        <p className="mt-1 text-xs text-ink-secondary">ou arraste os arquivos para cá · JPG, PNG ou WebP · até 5 MB cada</p>
        {images.length > 0 && <p className="mt-2 text-[11px] font-medium text-ink-secondary">{images.length} de {MAX_PRODUCT_IMAGES} imagens</p>}
      </div>

      <div className="hidden">
        {images.map((image) => <input aria-label="Substituir imagem do produto" key={image.key} ref={(element) => { if (element) replaceInputRefs.current.set(image.key, element); else replaceInputRefs.current.delete(image.key); }} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => onReplaceInput(image.key, event)} disabled={disabled || !blobConfigured} />)}
      </div>

      <ProductImageGallery
        images={images}
        disabled={disabled || Boolean(busyImageKey) || !blobConfigured}
        onRemove={(key) => void removeImage(key)}
        onReplace={(key) => replaceInputRefs.current.get(key)?.click()}
        onMakePrimary={(key) => void makePrimary(key)}
      />
    </section>
  );
}
