import { calculateConfiguredProductPrice } from "@/features/products/product-pricing";
import type { StoreProduct } from "@/types/store.types";

export interface CartAddition {
  selections?: Record<string, string[]>;
  quantity?: number;
}

export function requiresProductSelection(product: StoreProduct): boolean {
  return Boolean(product.options?.length || product.configuration?.optionGroups.length ||
    product.productType === "VARIATIONS" || product.productType === "BUILDABLE");
}

/** Validates public choices using the same calculator as the product editor. */
export function resolveCartAddition(product: StoreProduct, option?: string, addition: CartAddition = {}) {
  if (product.unavailable) throw new Error("Este produto está indisponível.");
  const quantity = addition.quantity ?? 1;
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Informe uma quantidade válida.");
  const configuration = product.configuration;
  if (configuration?.optionGroups.length) {
    const selections = addition.selections ?? {};
    const price = calculateConfiguredProductPrice(product.priceCents, configuration, selections);
    const normalized = Object.fromEntries(configuration.optionGroups
      .filter((group) => selections[group.id]?.length)
      .map((group) => [group.id, [...selections[group.id]].sort()])
      .sort(([left], [right]) => String(left).localeCompare(String(right))));
    const label = configuration.optionGroups.filter((group) => normalized[group.id]?.length).map((group) =>
      `${group.name}: ${group.options.filter((item) => normalized[group.id].includes(item.id)).map((item) => item.name).join(", ")}`
    ).join("; ");
    return { product: { ...product, priceCents: price.totalCents }, option: label || undefined,
      identity: normalized, selections: normalized, quantity };
  }
  if (product.productType === "BUILDABLE" || product.productType === "VARIATIONS") {
    throw new Error("A configuração deste produto ainda não está disponível. Entre em contato com a loja.");
  }
  if (product.options?.length && (!option || !product.options.includes(option))) {
    throw new Error("Escolha uma opção antes de adicionar.");
  }
  return { product, option, identity: option ?? "", selections: undefined, quantity };
}
