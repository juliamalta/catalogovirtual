"use client";

import { DashboardPageHeader } from "./dashboard-page-header";
import { ProductEditorActions, ProductMoneyInput } from "./product-editor-fields";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { upload, uploadPresigned } from "@vercel/blob/client";
import { createProductAction, readProductImagesAction, reorderProductImagesAction, updateProductAction, cleanupUnattachedProductImageAction } from "@/app/painel/actions";
import type { ProductImageRecord, ProductImageSlot, ProductImageMimeType, ProductImageUploadMode } from "@/features/images/image-storage.types";
import { productImageUploadErrorMessage } from "@/features/images/product-image-upload-error";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";
import { ProductConfigurationEditor } from "@/components/dashboard/product-configuration-editor";
import type { ProductConfigurationDTO, ProductType } from "@/types/product-configuration.types";

interface ProductFormProps {
  storeSlug: string;
  storeName: string;
  storeId: string;
  blobUploadMode: ProductImageUploadMode | null;
  categories: { id: string; name: string }[];
  initialProductType?: ProductType;
  initialConfiguration?: ProductConfigurationDTO;
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

export function ProductForm({ storeSlug, storeName, storeId, blobUploadMode, categories, product, initialProductType = "SIMPLE", initialConfiguration, submit = "Salvar produto" }: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [productId, setProductId] = useState(product?.id);
  const [images, setImages] = useState<ProductImageSlot[]>(() => toSlots(product?.images));
  const [simpleOptions, setSimpleOptions] = useState(() => product?.options.join("\n") ?? "");
  const [productType, setProductType] = useState<ProductType>(initialProductType);
  const [editorConfiguration, setEditorConfiguration] = useState(initialConfiguration);
  const [editorRevision, setEditorRevision] = useState(0);
  const [basePrice, setBasePrice] = useState(product ? `${Math.floor(product.priceCents / 100)},${String(product.priceCents % 100).padStart(2, "0")}` : "");
  const [details, setDetails] = useState(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    sortOrder: String(product?.sortOrder ?? 0)
  }));
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
        const uploadImage = blobUploadMode === "presigned" ? uploadPresigned : upload;
        // A failed confirmation is not proof that the upload failed. Reconcile
        // the same object on retry until cleanup confirms it was removed.
        const uploadedBlobUrl = item.uploadedBlobUrl ?? (await uploadImage(pathname, item.file, {
          access: "public",
          handleUploadUrl: blobUploadMode === "presigned"
            ? "/api/products/images/upload?mode=presigned"
            : "/api/products/images/upload",
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
        })).url;
        workingImages = workingImages.map((image) => image.key === item.key ? { ...image, uploadedBlobUrl } : image);
        setImages(workingImages);

        let savedImage: ProductImageRecord | undefined;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const result = await readProductImagesAction(storeSlug, currentProductId);
          savedImage = result.images.find((image) => image.imageUrl === uploadedBlobUrl);
          if (savedImage) break;
          await delay(500);
        }

        if (!savedImage) {
          const cleanup = await cleanupUnattachedProductImageAction(storeSlug, currentProductId, uploadedBlobUrl);
          if (cleanup.success) {
            workingImages = workingImages.map((image) => image.key === item.key ? { ...image, uploadedBlobUrl: undefined } : image);
          }
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
          uploadedBlobUrl: undefined,
          replaceImageId: undefined,
          status: "uploaded",
          progress: undefined,
          error: undefined
        } : image);
        setImages(workingImages);
      } catch (uploadError) {
        const message = productImageUploadErrorMessage(uploadError);
        workingImages = workingImages.map((image) => image.key === item.key ? {
          ...image,
          status: "error",
          error: message
        } : image);
        setImages(workingImages);
        throw new Error(message);
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
      formData.set("isActive", String(details.isActive));
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
          if (result.configuration) {
            setEditorConfiguration(result.configuration);
            setEditorRevision((current) => current + 1);
          }
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
    <form ref={formRef} onSubmit={handleSubmit} className="dashboard-form product-editor" aria-busy={pending} onInvalidCapture={(event) => {
      const target = event.target as HTMLElement;
      let parent = target.parentElement;
      while (parent && parent !== formRef.current) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
    }}>
      <DashboardPageHeader eyebrow="Catálogo da loja" title={product ? "Editar produto" : "Adicionar produto"}
        description="Defina o produto, suas opções e quando vender." storeName={storeName}
        breadcrumb={[{ label: "Produtos", href: `/painel/${storeSlug}/produtos` }, { label: product?.name ?? "Adicionar produto" }]}
        actions={<ProductEditorActions pending={pending} submit={submit} cancelHref={`/painel/${storeSlug}/produtos`} />} />
      <fieldset disabled={pending} className="min-w-0 space-y-3">
        <ProductConfigurationEditor key={editorRevision} productType={productType} initialConfiguration={editorConfiguration} onProductTypeChange={setProductType}
          basicFields={<div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <label className="field min-w-0">Nome<input name="name" required minLength={2} maxLength={140} value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Marmita de frango grelhado" /></label>
            <label className="field min-w-0">Categoria<select name="categoryId" value={details.categoryId} onChange={(event) => setDetails((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="field sm:col-span-2">Descrição<textarea name="description" rows={2} maxLength={2000} value={details.description} onChange={(event) => setDetails((current) => ({ ...current, description: event.target.value }))} placeholder="Ingredientes, acompanhamentos e detalhes do produto." /></label>
          </div>}
          basePriceField={productType === "VARIATIONS" ? null : <label className="field w-full sm:max-w-[200px]">{productType === "BUILDABLE" ? "Preço base" : "Preço"}<ProductMoneyInput name="price" required placeholder="0,00" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} /></label>}
          simpleOptionsField={<label className="field">Opções sem adicional <span className="field-hint-inline">Uma opção por linha</span><textarea name="options" value={simpleOptions} onChange={(event) => setSimpleOptions(event.target.value)} placeholder={"Ex.: Sem gelo\nSem açúcar"} /></label>}
          imageFields={<ProductImageUpload showHeading={false} images={images} onImagesChange={setImages} storeSlug={storeSlug} productId={productId} blobConfigured={blobUploadMode !== null} disabled={pending} />}
          availabilityFields={<div className="grid gap-3 sm:grid-cols-2">
            <label className="dashboard-checkbox-field"><input name="isActive" type="checkbox" checked={details.isActive} onChange={(event) => setDetails((current) => ({ ...current, isActive: event.target.checked }))} /><span><strong>Mostrar na loja</strong><small>Desmarque para ocultar sem excluir o produto.</small></span></label>
            <label className="dashboard-checkbox-field"><input name="isFeatured" type="checkbox" checked={details.isFeatured} onChange={(event) => setDetails((current) => ({ ...current, isFeatured: event.target.checked }))} /><span><strong>Em destaque</strong><small>Realce este item no catálogo.</small></span></label>
            <label className="field sm:max-w-[200px]">Ordem de apresentação<input name="sortOrder" type="number" min="0" value={details.sortOrder} onChange={(event) => setDetails((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
          </div>}
        />
      </fieldset>
      <div className="product-editor-actions sticky bottom-0 z-20 mt-3 rounded-xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur sm:p-4">
        {error && <p className="auth-error mb-3" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-xs text-ink-secondary">{pending ? "Salvando produto e imagens…" : "Revise os detalhes antes de salvar."}</p>
          <ProductEditorActions pending={pending} submit={submit} cancelHref={`/painel/${storeSlug}/produtos`} />
        </div>
      </div>
    </form>
  );
}
