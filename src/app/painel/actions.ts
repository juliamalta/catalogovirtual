"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCategoryForStore, createProductForStore, createStoreForUser, deleteCategoryForStore, deleteProductForStore, isStoreSlugAvailableForUser, setProductActiveForStore, setStorePublication, updateCategoryForStore, updateProductForStore, updateStoreBusinessHours, updateStoreForUser, StoreInputError } from "@/server/services/store.service";
import { cleanupUnattachedProductBlob, getProductImagesForUser, makeProductImagePrimaryForUser, ProductImageStorageError, removeProductImageForUser, reorderProductImagesForUser } from "@/server/services/blob-storage.service";
import { cleanupUnattachedStoreAppearanceImage, StoreAppearanceImageError } from "@/server/services/store-image-storage.service";
import type { ProductConfigurationDTO } from "@/types/product-configuration.types";

export interface ActionState { error?: string }
export interface ProductMutationResult { success: boolean; productId?: string; configuration?: ProductConfigurationDTO; error?: string }
const textField = (formData: FormData, key: string) => { const value = formData.get(key); return typeof value === "string" ? value : ""; };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function friendlyError(error: unknown) {
  if (error instanceof StoreInputError) return error.message;
  if (error && typeof error === "object" && "code" in error && error.code === "23505") return "Esse endereço já está em uso. Escolha outro.";
  return "Não foi possível salvar. Confira os dados e tente novamente.";
}

export async function checkStoreSlugAction(slug: string): Promise<{ available: boolean; error?: string }> {
  try {
    return { available: await isStoreSlugAvailableForUser(slug) };
  } catch {
    return { available: false, error: "Não foi possível verificar o endereço agora." };
  }
}

export async function createStoreAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let slug = "";
  try {
    const store = await createStoreForUser({
      name: textField(formData, "name"), slug: textField(formData, "slug"), description: textField(formData, "description"),
      storefrontType: textField(formData, "storefrontType"), whatsappNumber: textField(formData, "whatsappNumber"),
      primaryColor: textField(formData, "primaryColor") || "#7351D6"
    });
    revalidatePath("/painel");
    slug = store.slug;
  } catch (error) { return { error: friendlyError(error) }; }
  redirect(`/painel/${slug}`);
}

export async function createProductAction(storeSlug: string, formData: FormData): Promise<ProductMutationResult> {
  try {
    const product = await createProductForStore(storeSlug, formData);
    revalidatePath(`/painel/${storeSlug}`);
    revalidatePath(`/painel/${storeSlug}/produtos`);
    return { success: true, productId: product.id, configuration: product.productConfiguration };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
}

export async function updateProductAction(storeSlug: string, productId: string, formData: FormData): Promise<ProductMutationResult> {
  if (!idPattern.test(productId)) return { success: false, error: "Produto inválido." };
  try {
    await updateProductForStore(storeSlug, productId, formData);
    revalidatePath(`/painel/${storeSlug}`);
    revalidatePath(`/painel/${storeSlug}/produtos`);
    revalidatePath(`/painel/${storeSlug}/produtos/${productId}`);
    return { success: true, productId };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
}

export async function readProductImagesAction(storeSlug: string, productId: string) {
  try {
    return { images: await getProductImagesForUser(storeSlug, productId) };
  } catch {
    return { images: [], error: "Não foi possível atualizar as imagens deste produto." };
  }
}

export async function removeProductImageAction(storeSlug: string, productId: string, imageId: string) {
  try {
    await removeProductImageForUser(storeSlug, productId, imageId);
    revalidatePath(`/painel/${storeSlug}/produtos/${productId}`);
    revalidatePath(`/${storeSlug}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ProductImageStorageError ? error.message : "Não foi possível remover a imagem." };
  }
}

export async function makeProductImagePrimaryAction(storeSlug: string, productId: string, imageId: string) {
  try {
    await makeProductImagePrimaryForUser(storeSlug, productId, imageId);
    revalidatePath(`/painel/${storeSlug}/produtos/${productId}`);
    revalidatePath(`/${storeSlug}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ProductImageStorageError ? error.message : "Não foi possível atualizar a foto principal." };
  }
}

export async function reorderProductImagesAction(storeSlug: string, productId: string, imageIds: string[]) {
  try {
    await reorderProductImagesForUser(storeSlug, productId, imageIds);
    revalidatePath(`/painel/${storeSlug}/produtos/${productId}`);
    revalidatePath(`/${storeSlug}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ProductImageStorageError ? error.message : "Não foi possível ordenar as imagens." };
  }
}

export async function cleanupUnattachedProductImageAction(storeSlug: string, productId: string, imageUrl: string) {
  try {
    return { success: await cleanupUnattachedProductBlob(storeSlug, productId, imageUrl) };
  } catch {
    return { success: false };
  }
}

export async function removeProductAction(storeSlug: string, productId: string) {
  if (!idPattern.test(productId)) redirect(`/painel/${storeSlug}/produtos?erro=Produto%20inv%C3%A1lido`);
  try { await deleteProductForStore(storeSlug, productId); }
  catch (error) { redirect(`/painel/${storeSlug}/produtos?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}`); revalidatePath(`/painel/${storeSlug}/produtos`);
  redirect(`/painel/${storeSlug}/produtos?status=produto-excluido`);
}

export async function toggleProductAction(storeSlug: string, productId: string, isActive: boolean) {
  if (!idPattern.test(productId)) redirect(`/painel/${storeSlug}/produtos?erro=Produto%20inv%C3%A1lido`);
  try { await setProductActiveForStore(storeSlug, productId, isActive); }
  catch (error) { redirect(`/painel/${storeSlug}/produtos?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}`); revalidatePath(`/painel/${storeSlug}/produtos`);
  redirect(`/painel/${storeSlug}/produtos?status=produto-atualizado`);
}

export async function createCategoryAction(storeSlug: string, formData: FormData) {
  try { await createCategoryForStore(storeSlug, formData); }
  catch (error) { redirect(`/painel/${storeSlug}/categorias?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}`); revalidatePath(`/painel/${storeSlug}/categorias`);
  redirect(`/painel/${storeSlug}/categorias?status=categoria-criada`);
}

export async function updateCategoryAction(storeSlug: string, categoryId: string, formData: FormData) {
  if (!idPattern.test(categoryId)) redirect(`/painel/${storeSlug}/categorias?erro=Categoria%20inv%C3%A1lida`);
  try { await updateCategoryForStore(storeSlug, categoryId, formData); }
  catch (error) { redirect(`/painel/${storeSlug}/categorias/${categoryId}?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}/categorias`);
  redirect(`/painel/${storeSlug}/categorias?status=categoria-atualizada`);
}

export async function removeCategoryAction(storeSlug: string, categoryId: string) {
  if (!idPattern.test(categoryId)) redirect(`/painel/${storeSlug}/categorias?erro=Categoria%20inv%C3%A1lida`);
  try { await deleteCategoryForStore(storeSlug, categoryId); }
  catch (error) { redirect(`/painel/${storeSlug}/categorias?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}/categorias`); revalidatePath(`/painel/${storeSlug}/produtos`);
  redirect(`/painel/${storeSlug}/categorias?status=categoria-excluida`);
}

export async function updateStoreAction(storeSlug: string, formData: FormData) {
  try { await updateStoreForUser(storeSlug, formData); }
  catch (error) { redirect(`/painel/${storeSlug}/configuracoes?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}`); revalidatePath(`/painel/${storeSlug}/configuracoes`);
  revalidatePath(`/${storeSlug}`); revalidatePath(`/${storeSlug}/preview`);
  redirect(`/painel/${storeSlug}/configuracoes?status=salvo`);
}

export async function saveStoreHoursAction(storeSlug: string, configuration: unknown) {
  try {
    const status = await updateStoreBusinessHours(storeSlug, configuration);
    revalidatePath(`/painel/${storeSlug}/configuracoes`);
    revalidatePath(`/${storeSlug}`);
    revalidatePath(`/${storeSlug}/preview`);
    return { success: true as const, status };
  } catch (error) {
    return { success: false as const, error: friendlyError(error) };
  }
}

export async function saveStoreAppearanceAction(storeSlug: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await updateStoreForUser(storeSlug, formData);
    revalidatePath(`/painel/${storeSlug}`);
    revalidatePath(`/painel/${storeSlug}/aparencia`);
    revalidatePath(`/${storeSlug}`);
    revalidatePath(`/${storeSlug}/preview`);
    return { success: true };
  } catch (error) {
    if (error instanceof StoreAppearanceImageError) return { success: false, error: error.message };
    return { success: false, error: friendlyError(error) };
  }
}

export async function cleanupUnattachedStoreAppearanceImageAction(storeSlug: string, imageUrl: string, assetType: "logo" | "cover") {
  try {
    return { success: await cleanupUnattachedStoreAppearanceImage(storeSlug, imageUrl, assetType) };
  } catch {
    return { success: false };
  }
}

export async function toggleStorePublicationAction(storeSlug: string, isPublished: boolean) {
  try { await setStorePublication(storeSlug, isPublished); }
  catch (error) { redirect(`/painel/${storeSlug}?erro=${encodeURIComponent(friendlyError(error))}`); }
  revalidatePath(`/painel/${storeSlug}`); revalidatePath(`/painel`); revalidatePath(`/${storeSlug}`);
  redirect(`/painel/${storeSlug}?status=${isPublished ? "publicada" : "despublicada"}`);
}
