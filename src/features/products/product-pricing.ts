import type { ProductConfigurationDTO } from "@/types/product-configuration.types";

const MAX_CENTS = 2_147_483_647;

export class ProductConfigurationSelectionError extends Error {}

export interface ProductPriceResult {
  totalCents: number;
  matchedPriceRuleId: string | null;
}

/** Computes one configured unit price using integer cents only. */
export function calculateConfiguredProductPrice(
  basePriceCents: number,
  configuration: ProductConfigurationDTO,
  selectedByGroup: Record<string, string[]>
): ProductPriceResult {
  if (!Number.isInteger(basePriceCents) || basePriceCents < 0 || basePriceCents > MAX_CENTS) {
    throw new ProductConfigurationSelectionError("O preço base do produto é inválido.");
  }

  const selectedIds = new Set<string>();
  const selectedOptions = [] as Array<{ id: string; kind: "VARIANT" | "CUSTOMIZATION"; priceCents: number | null; priceDeltaCents: number }>;

  for (const group of configuration.optionGroups) {
    const optionIds = selectedByGroup[group.id] ?? [];
    if (!group.isActive && optionIds.length) {
      throw new ProductConfigurationSelectionError(`O grupo “${group.name}” não está disponível.`);
    }
    if (new Set(optionIds).size !== optionIds.length) {
      throw new ProductConfigurationSelectionError(`O grupo “${group.name}” contém escolhas repetidas.`);
    }
    const activeOptions = new Map(group.options.filter((option) => option.isActive).map((option) => [option.id, option]));
    if (optionIds.some((id) => !activeOptions.has(id))) {
      throw new ProductConfigurationSelectionError(`Escolha uma opção válida para “${group.name}”.`);
    }
    const minimum = group.isActive ? group.minSelections : 0;
    const maximum = group.isActive ? group.maxSelections : 0;
    if (optionIds.length < minimum || optionIds.length > maximum) {
      throw new ProductConfigurationSelectionError(`Selecione entre ${minimum} e ${maximum} opções em “${group.name}”.`);
    }
    for (const id of optionIds) {
      const option = activeOptions.get(id)!;
      selectedIds.add(id);
      selectedOptions.push({ id, kind: group.kind, priceCents: option.priceCents, priceDeltaCents: option.priceDeltaCents });
    }
  }

  const unknownGroupIds = Object.keys(selectedByGroup).filter((id) => !configuration.optionGroups.some((group) => group.id === id));
  if (unknownGroupIds.length) throw new ProductConfigurationSelectionError("Uma escolha pertence a um grupo inexistente.");

  const matchingRules = configuration.priceRules.filter((rule) => rule.isActive && rule.optionIds.every((id) => selectedIds.has(id)));
  if (matchingRules.length > 1) {
    throw new ProductConfigurationSelectionError("As escolhas correspondem a mais de uma regra de preço.");
  }

  const matchingRule = matchingRules[0];
  const selectedVariant = selectedOptions.find((option) => option.kind === "VARIANT");
  let totalCents = matchingRule?.priceCents ?? selectedVariant?.priceCents ?? basePriceCents;
  if (!Number.isInteger(totalCents) || totalCents < 0 || totalCents > MAX_CENTS) {
    throw new ProductConfigurationSelectionError("O preço calculado é inválido.");
  }

  const includedOptionIds = new Set(matchingRule?.optionIds ?? []);
  for (const option of selectedOptions) {
    if (option.kind !== "CUSTOMIZATION" || includedOptionIds.has(option.id)) continue;
    totalCents += option.priceDeltaCents;
    if (totalCents > MAX_CENTS) throw new ProductConfigurationSelectionError("O preço calculado ultrapassa o limite permitido.");
  }

  return { totalCents, matchedPriceRuleId: matchingRule?.id ?? null };
}
