"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createProductAction, readProductImagesAction, reorderProductImagesAction, updateProductAction, cleanupUnattachedProductImageAction } from "@/app/painel/actions";
import type { ProductImageRecord, ProductImageSlot, ProductImageMimeType } from "@/features/images/image-storage.types";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";

interface ProductFormProps {
  storeSlug: string;
  storeId: string;
  blobConfigured: boolean;
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    categoryId: string | null;
    options: string[];
    images: ProductImageRecord[];
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
  };
  submit?: string;
}

const extensionByMime: Record<ProductImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function toSlots(images: ProductImageRecord[] = []): ProductImageSlot[] {
  return images.map((image) => ({
    key: image.id,
    imageId: image.id,
    imageUrl: image.imageUrl,
    originalImageUrl: image.imageUrl,
    altText: image.altText,
    status: "uploaded"
  }));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ProductForm({ storeSlug, storeId, blobConfigured, categories, product, submit = "Salvar produto" }: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [productId, setProductId] = useState(product?.id);
  const [images, setImages] = useState<ProductImageSlot[]>(() => toSlots(product?.images));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function updateImageSlot(key: string, update: Partial<ProductImageSlot>) {
    setImages((current) => current.map((image) => image.key === key ? { ...image, ...update } : image));
  }

  async function uploadPendingImages(currentProductId: string) {
    let workingImages = images;
    const pendingImages = workingImages.filter((image) => image.file);

    for (const item of pendingImages) {
      if (!item.file) continue;
      const mimeType = item.file.type as ProductImageMimeType;
      const pathname = `stores/${storeId}/products/${currentProductId}/${crypto.randomUUID()}.${extensionByMime[mimeType]}`;
      workingImages = workingImages.map((image) => image.key === item.key ? { ...image, status: "uploading", progress: 0, error: undefined } : image);
      setImages(workingImages);

      try {
        const blob = await upload(pathname, item.file, {
          access: "public",
          handleUploadUrl: "/api/products/images/upload",
          contentType: mimeType,
          clientPayload: JSON.stringify({
            storeSlug,
            productId: currentProductId,
            mimeType,
            size: item.file.size,
            ...(item.replaceImageId ? { replaceImageId: item.replaceImageId } : {})
          }),
          onUploadProgress: ({ percentage }) => {
            updateImageSlot(item.key, { progress: Math.round(percentage) });
          }
        });

        let savedImage: ProductImageRecord | undefined;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const result = await readProductImagesAction(storeSlug, currentProductId);
          savedImage = result.images.find((image) => image.imageUrl === blob.url);
          if (savedImage) break;
          await delay(500);
        }

        if (!savedImage) {
          await cleanupUnattachedProductImageAction(storeSlug, currentProductId, blob.url);
          throw new Error("O arquivo chegou ao Blob, mas a confirmação no banco não respondeu. Em desenvolvimento, configure VERCEL_BLOB_CALLBACK_URL com um túnel HTTPS e tente novamente.");
        }

        if (item.imageUrl.startsWith("blob:")) URL.revokeObjectURL(item.imageUrl);
        workingImages = workingImages.map((image) => image.key === item.key ? {
          ...image,
          imageId: savedImage.id,
          imageUrl: savedImage.imageUrl,
          originalImageUrl: savedImage.imageUrl,
          altText: savedImage.altText,
          file: undefined,
          replaceImageId: undefined,
          status: "uploaded",
          progress: undefined,
          error: undefined
        } : image);
        setImages(workingImages);
      } catch (uploadError) {
        workingImages = workingImages.map((image) => image.key === item.key ? {
          ...image,
          status: "error",
          error: uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem."
        } : image);
        setImages(workingImages);
        throw uploadError;
      }
    }

    const orderedIds = workingImages.map((image) => image.imageId).filter((id): id is string => Boolean(id));
    if (orderedIds.length) {
      const ordered = await reorderProductImagesAction(storeSlug, currentProductId, orderedIds);
      if (!ordered.success) throw new Error(ordered.error || "Não foi possível salvar a ordem das fotos.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !formRef.current) return;
    setError(undefined);
    setPending(true);

    try {
      const formData = new FormData(formRef.current);
      formData.set("imageUrl", "");
      let currentProductId = productId;
      let result;

      if (currentProductId) {
        result = await updateProductAction(storeSlug, currentProductId, formData);
      } else {
        result = await createProductAction(storeSlug, formData);
        if (result.productId) {
          currentProductId = result.productId;
          setProductId(currentProductId);
        }
      }

      if (!result.success || !currentProductId) throw new Error(result.error || "Não foi possível salvar o produto.");
      await uploadPendingImages(currentProductId);
      router.push(`/painel/${storeSlug}/produtos?status=${product ? "produto-atualizado" : "produto-criado"}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar o produto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="dashboard-form dashboard-product-form">
      <div className="dashboard-product-form-main">
        <section className="dashboard-form-section">
          <div className="dashboard-form-section-heading"><span>01</span><div><h2>Informações básicas</h2><p>Apresente o produto de forma clara para seus clientes.</p></div></div>
          <div className="dashboard-product-fields">
            <label className="field dashboard-field-wide">Nome<input name="name" required minLength={2} maxLength={140} defaultValue={product?.name} placeholder="Ex.: Bolo de chocolate" /></label>
            <label className="field dashboard-field-wide">Descrição<textarea name="description" maxLength={2000} defaultValue={product?.description} placeholder="Conte o que torna este produto especial." /></label>
            <label className="field dashboard-field-wide">Categoria<select name="categoryId" defaultValue={product?.categoryId ?? ""}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          </div>
        </section>

        <section className="dashboard-form-section">
          <div className="dashboard-form-section-heading"><span>02</span><div><h2>Imagens</h2><p>Use fotos nítidas para mostrar cada detalhe.</p></div></div>
          <ProductImageUpload images={images} onImagesChange={setImages} storeSlug={storeSlug} productId={productId} blobConfigured={blobConfigured} disabled={pending} />
        </section>

        <section className="dashboard-form-section">
          <div className="dashboard-form-section-heading"><span>03</span><div><h2>Opções e adicionais</h2><p>Inclua variações disponíveis para este produto.</p></div></div>
          <label className="field">Opções <span className="field-hint-inline">Uma opção por linha</span><textarea name="options" defaultValue={product?.options.join("\n")} placeholder={"Ex.: Tamanho grande\nSem açúcar"} /></label>
        </section>
      </div>

      <aside className="dashboard-product-form-side">
        <section className="dashboard-form-section dashboard-price-card">
          <div className="dashboard-form-section-heading"><span>04</span><div><h2>Preço</h2><p>Valor em reais.</p></div></div>
          <label className="field">Preço<input name="price" required inputMode="decimal" placeholder="12,50" defaultValue={product ? `${Math.floor(product.priceCents / 100)},${String(product.priceCents % 100).padStart(2, "0")}` : undefined} /></label>
        </section>

        <section className="dashboard-form-section dashboard-availability-card">
          <div className="dashboard-form-section-heading"><span>05</span><div><h2>Disponibilidade</h2><p>Controle como o item aparece.</p></div></div>
          <label className="dashboard-checkbox-field"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /><span><strong>Produto ativo</strong><small>Visível na sua loja.</small></span></label>
          <label className="dashboard-checkbox-field"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured} /><span><strong>Em destaque</strong><small>Realce este item no catálogo.</small></span></label>
          <label className="field">Ordem de apresentação<input name="sortOrder" type="number" min="0" defaultValue={product?.sortOrder ?? 0} /></label>
        </section>

        <div className="dashboard-product-save">
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending}>{pending ? "Salvando produto e imagens…" : submit}</button>
          <p>Você poderá atualizar essas informações depois.</p>
        </div>
      </aside>
    </form>
  );
}
