import type { CartLine, StoreProduct } from "@/types/store.types";
import { resolveCartAddition } from "./product-selection";

/** Restore identity/choices only; prices and product data always come from this store's catalog. */
export function reconcileCart(saved: unknown, products: StoreProduct[]): CartLine[] {
  if (!Array.isArray(saved)) return [];
  const catalog = new Map(products.map((product) => [product.id, product]));
  const result: CartLine[] = [];
  for (const candidate of saved) {
    if (!candidate || typeof candidate !== "object") continue;
    const product = catalog.get(candidate.product?.id);
    if (!product || !Number.isSafeInteger(candidate.quantity) || candidate.quantity < 1) continue;
    if (candidate.selections !== undefined && (!candidate.selections || typeof candidate.selections !== "object" || Array.isArray(candidate.selections) ||
      Object.values(candidate.selections).some((ids) => !Array.isArray(ids) || ids.some((id) => typeof id !== "string")))) continue;
    try {
      const resolved = resolveCartAddition(product, typeof candidate.option === "string" ? candidate.option : undefined,
        { selections: candidate.selections, quantity: candidate.quantity });
      if (!Number.isSafeInteger(resolved.product.priceCents * candidate.quantity)) continue;
      const note = typeof candidate.note === "string" ? candidate.note.trim() || undefined : undefined;
      const key = JSON.stringify([product.id, resolved.identity, note ?? ""]);
      const existing = result.find((line) => line.key === key);
      if (existing) {
        const quantity = existing.quantity + candidate.quantity;
        if (Number.isSafeInteger(quantity) && Number.isSafeInteger(quantity * resolved.product.priceCents)) existing.quantity = quantity;
      } else result.push({ key, product: resolved.product, quantity: candidate.quantity,
        ...(resolved.option ? { option: resolved.option } : {}), ...(resolved.selections ? { selections: resolved.selections } : {}), ...(note ? { note } : {}) });
    } catch { /* Invalid, removed or unavailable choices must not survive restoration. */ }
  }
  return result;
}
