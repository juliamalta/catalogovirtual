import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { productAvailabilityDays, productOptionGroups, productOptions, productPriceRuleOptions, productPriceRules } from "@/lib/db/schema";
import { productConfigurationDeletionSchema, productEditorConfigurationSchema, type ProductConfigurationDeletions, type ProductConfigurationInput } from "@/lib/validations/product-configuration";
import type { ProductConfigurationDTO, ProductType } from "@/types/product-configuration.types";

type StoreTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export interface ProductEditorData {
  productType: ProductType;
  configuration: ProductConfigurationInput;
  deletions: ProductConfigurationDeletions;
  priceCents: number | null;
}

export class ProductConfigurationError extends Error {}

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function assignMissingIds(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const configuration = value as Record<string, unknown>;
  if (!Array.isArray(configuration.optionGroups)) return value;
  return {
    ...configuration,
    optionGroups: configuration.optionGroups.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const group = item as Record<string, unknown>;
      return {
        ...group,
        ...(typeof group.id === "string" ? {} : { id: randomUUID() }),
        ...(Array.isArray(group.options) ? {
          options: group.options.map((option) => {
            if (!option || typeof option !== "object" || Array.isArray(option)) return option;
            const record = option as Record<string, unknown>;
            return { ...record, ...(typeof record.id === "string" ? {} : { id: randomUUID() }) };
          })
        } : {})
      };
    }),
    ...(Array.isArray(configuration.priceRules) ? {
      priceRules: configuration.priceRules.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return item;
        const rule = item as Record<string, unknown>;
        return { ...rule, ...(typeof rule.id === "string" ? {} : { id: randomUUID() }) };
      })
    } : {})
  };
}

export function parseProductEditorData(formData: FormData): ProductEditorData {
  const rawType = textField(formData, "productType") || "SIMPLE";
  let rawConfiguration: unknown = { availability: { mode: "ALWAYS", days: [] }, optionGroups: [], priceRules: [] };
  const serialized = textField(formData, "productConfiguration");
  if (serialized) {
    try {
      rawConfiguration = JSON.parse(serialized) as unknown;
    } catch {
      throw new Error("As configurações do produto estão inválidas. Atualize a página e tente novamente.");
    }
  }

  const parsedEditor = productEditorConfigurationSchema.safeParse({
    productType: rawType,
    configuration: assignMissingIds(rawConfiguration)
  });
  if (!parsedEditor.success) {
    throw new Error(parsedEditor.error.issues[0]?.message ?? "Confira as variações e opções do produto.");
  }

  let rawDeletions: unknown = { groupIds: [], optionIds: [], priceRuleIds: [] };
  const serializedDeletions = textField(formData, "productConfigurationDeletes");
  if (serializedDeletions) {
    try {
      rawDeletions = JSON.parse(serializedDeletions) as unknown;
    } catch {
      throw new Error("A lista de itens removidos e invalida. Atualize a pagina e tente novamente.");
    }
  }
  const parsedDeletions = productConfigurationDeletionSchema.safeParse(rawDeletions);
  if (!parsedDeletions.success) {
    throw new Error(parsedDeletions.error.issues[0]?.message ?? "Confira os itens removidos.");
  }

  let priceCents: number | null = null;
  if (parsedEditor.data.productType === "VARIATIONS") {
    const group = parsedEditor.data.configuration.optionGroups.find((item) => item.kind === "VARIANT");
    const activePrices = group?.options.filter((option) => option.isActive).map((option) => option.priceCents) ?? [];
    if (!activePrices.length) throw new Error("Mantenha ao menos uma variação ativa com preço.");
    priceCents = Math.min(...activePrices);
  } else {
    const value = textField(formData, "price").trim();
    const match = value.match(/^(\d{1,7})(?:,(\d{1,2}))?$/);
    if (!match) throw new Error("Informe o preço no formato 12,50.");
    const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
    if (!Number.isSafeInteger(cents) || cents > 2_147_483_647) throw new Error("O preço deve ser válido.");
    priceCents = cents;
  }

  return {
    productType: parsedEditor.data.productType,
    configuration: parsedEditor.data.configuration,
    deletions: parsedDeletions.data,
    priceCents
  };
}

export async function replaceProductConfiguration(
  tx: StoreTransaction,
  storeId: string,
  productId: string,
  configuration: ProductConfigurationInput,
  deletions: ProductConfigurationDeletions
) {
  // Client UUIDs can identify new editor rows, but an existing ID must belong
  // to this exact product and store. Never silently reinterpret a foreign ID.
  const submittedIds = {
    groups: configuration.optionGroups.flatMap((group) => group.id ? [group.id] : []),
    options: configuration.optionGroups.flatMap((group) => group.options.flatMap((option) => option.id ? [option.id] : [])),
    rules: configuration.priceRules.flatMap((rule) => rule.id ? [rule.id] : [])
  };
  for (const [table, ids] of [
    [productOptionGroups, submittedIds.groups],
    [productOptions, submittedIds.options],
    [productPriceRules, submittedIds.rules]
  ] as const) {
    if (!ids.length) continue;
    const existing = await tx.select({ storeId: table.storeId, productId: table.productId }).from(table)
      .where(inArray(table.id, ids));
    if (existing.some((row) => row.storeId !== storeId || row.productId !== productId)) {
      throw new ProductConfigurationError("Uma configuração enviada não pertence a este produto.");
    }
  }
  const currentGroups = await tx.select({ id: productOptionGroups.id }).from(productOptionGroups)
    .where(and(eq(productOptionGroups.storeId, storeId), eq(productOptionGroups.productId, productId)));
  const currentOptions = await tx.select({ id: productOptions.id, groupId: productOptions.groupId }).from(productOptions)
    .where(and(eq(productOptions.storeId, storeId), eq(productOptions.productId, productId)));
  const currentRules = await tx.select({ id: productPriceRules.id }).from(productPriceRules)
    .where(and(eq(productPriceRules.storeId, storeId), eq(productPriceRules.productId, productId)));
  const currentDays = await tx.select({ dayOfWeek: productAvailabilityDays.dayOfWeek }).from(productAvailabilityDays)
    .where(and(eq(productAvailabilityDays.storeId, storeId), eq(productAvailabilityDays.productId, productId)));

  const currentGroupIds = new Set(currentGroups.map((group) => group.id));
  const currentOptionById = new Map(currentOptions.map((option) => [option.id, option]));
  const currentRuleIds = new Set(currentRules.map((rule) => rule.id));
  const removeGroupIds = new Set(deletions.groupIds);
  const removeOptionIds = new Set(deletions.optionIds);
  const removeRuleIds = new Set(deletions.priceRuleIds);

  if (deletions.groupIds.some((id) => !currentGroupIds.has(id)) ||
      deletions.optionIds.some((id) => !currentOptionById.has(id)) ||
      deletions.priceRuleIds.some((id) => !currentRuleIds.has(id))) {
    throw new ProductConfigurationError("Um item marcado para remoção não pertence a este produto.");
  }

  const incomingGroupIds = new Set(configuration.optionGroups.flatMap((group) => group.id ? [group.id] : []));
  const incomingGroupByOption = new Map<string, string>();
  for (const group of configuration.optionGroups) {
    for (const option of group.options) if (option.id) incomingGroupByOption.set(option.id, group.id ?? "");
  }
  const incomingRuleIds = new Set(configuration.priceRules.flatMap((rule) => rule.id ? [rule.id] : []));

  if (configuration.optionGroups.some((group) => group.id && removeGroupIds.has(group.id)) ||
      configuration.optionGroups.some((group) => group.options.some((option) => option.id && removeOptionIds.has(option.id))) ||
      configuration.priceRules.some((rule) => rule.id && removeRuleIds.has(rule.id))) {
    throw new ProductConfigurationError("Um item não pode ser atualizado e removido ao mesmo tempo.");
  }
  for (const group of currentGroups) {
    if (!incomingGroupIds.has(group.id) && !removeGroupIds.has(group.id)) {
      throw new ProductConfigurationError("Confirme a remoção dos grupos que deseja excluir.");
    }
  }
  for (const option of currentOptions) {
    if (removeGroupIds.has(option.groupId)) continue;
    if (!incomingGroupByOption.has(option.id) && !removeOptionIds.has(option.id)) {
      throw new ProductConfigurationError("Confirme a remoção das opções que deseja excluir.");
    }
    if (incomingGroupByOption.has(option.id) && incomingGroupByOption.get(option.id) !== option.groupId) {
      throw new ProductConfigurationError("A opção não pertence ao grupo enviado para atualização.");
    }
  }
  for (const rule of currentRules) {
    if (!incomingRuleIds.has(rule.id) && !removeRuleIds.has(rule.id)) {
      throw new ProductConfigurationError("Confirme a remoção das combinações de preço que deseja excluir.");
    }
  }

  if (deletions.priceRuleIds.length) {
    await tx.delete(productPriceRules).where(and(eq(productPriceRules.storeId, storeId), eq(productPriceRules.productId, productId), inArray(productPriceRules.id, deletions.priceRuleIds)));
  }
  if (deletions.optionIds.length) {
    await tx.delete(productOptions).where(and(eq(productOptions.storeId, storeId), eq(productOptions.productId, productId), inArray(productOptions.id, deletions.optionIds)));
  }
  if (deletions.groupIds.length) {
    await tx.delete(productOptionGroups).where(and(eq(productOptionGroups.storeId, storeId), eq(productOptionGroups.productId, productId), inArray(productOptionGroups.id, deletions.groupIds)));
  }

  const targetDays = configuration.availability.mode === "WEEKDAYS" ? new Set(configuration.availability.days) : new Set<number>();
  const currentDayNumbers = new Set(currentDays.map((day) => day.dayOfWeek));
  const daysToRemove = [...currentDayNumbers].filter((day) => !targetDays.has(day));
  const daysToInsert = [...targetDays].filter((day) => !currentDayNumbers.has(day));
  if (daysToRemove.length) {
    await tx.delete(productAvailabilityDays).where(and(eq(productAvailabilityDays.storeId, storeId), eq(productAvailabilityDays.productId, productId), inArray(productAvailabilityDays.dayOfWeek, daysToRemove)));
  }
  if (daysToInsert.length) {
    await tx.insert(productAvailabilityDays).values(daysToInsert.map((dayOfWeek) => ({ storeId, productId, dayOfWeek })));
  }

  const resolvedOptionIds = new Map<string, string>();
  const resolvedGroupIds = new Map<string, string>();
  const resolvedRuleIds = new Map<string, string>();
  const currentGroupSet = new Set(currentGroups.map((group) => group.id));
  for (const group of configuration.optionGroups) {
    const clientGroupId = group.id ?? randomUUID();
    const isOwnedGroup = currentGroupSet.has(clientGroupId);
    const groupId = isOwnedGroup ? clientGroupId : randomUUID();
    resolvedGroupIds.set(clientGroupId, groupId);
    const groupValues = {
      name: group.name,
      kind: group.kind,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      updatedAt: new Date()
    };
    if (isOwnedGroup) {
      await tx.update(productOptionGroups).set(groupValues)
        .where(and(eq(productOptionGroups.id, groupId), eq(productOptionGroups.storeId, storeId), eq(productOptionGroups.productId, productId)));
    } else {
      await tx.insert(productOptionGroups).values({ ...groupValues, id: groupId, storeId, productId });
    }

    for (const option of group.options) {
      const clientOptionId = option.id ?? randomUUID();
      const existingOption = currentOptionById.get(clientOptionId);
      if (existingOption && existingOption.groupId !== groupId) {
        throw new ProductConfigurationError("A opção não pertence ao grupo deste produto.");
      }
      const optionId = existingOption ? clientOptionId : randomUUID();
      resolvedOptionIds.set(clientOptionId, optionId);
      const optionValues = {
        name: option.name,
        priceCents: "priceCents" in option ? option.priceCents : null,
        priceDeltaCents: "priceDeltaCents" in option ? option.priceDeltaCents : 0,
        isActive: option.isActive,
        sortOrder: option.sortOrder,
        updatedAt: new Date()
      };
      if (existingOption) {
        await tx.update(productOptions).set(optionValues)
          .where(and(eq(productOptions.id, optionId), eq(productOptions.storeId, storeId), eq(productOptions.productId, productId), eq(productOptions.groupId, groupId)));
      } else {
        await tx.insert(productOptions).values({ ...optionValues, id: optionId, storeId, productId, groupId });
      }
    }
  }

  for (const rule of configuration.priceRules) {
    const clientRuleId = rule.id ?? randomUUID();
    const isOwnedRule = currentRuleIds.has(clientRuleId);
    const ruleId = isOwnedRule ? clientRuleId : randomUUID();
    resolvedRuleIds.set(clientRuleId, ruleId);
    const ruleValues = { name: rule.name, priceCents: rule.priceCents, isActive: rule.isActive, sortOrder: rule.sortOrder, updatedAt: new Date() };
    if (isOwnedRule) {
      await tx.update(productPriceRules).set(ruleValues)
        .where(and(eq(productPriceRules.id, ruleId), eq(productPriceRules.storeId, storeId), eq(productPriceRules.productId, productId)));
    } else {
      await tx.insert(productPriceRules).values({ ...ruleValues, id: ruleId, storeId, productId });
    }

    const targetOptionIds = new Set(rule.optionIds.map((clientOptionId) => {
      const resolvedId = resolvedOptionIds.get(clientOptionId);
      if (!resolvedId) throw new ProductConfigurationError("A combinação contém uma opção que não pertence a este produto.");
      return resolvedId;
    }));
    const existingLinks = await tx.select({ optionId: productPriceRuleOptions.optionId }).from(productPriceRuleOptions)
      .where(and(eq(productPriceRuleOptions.storeId, storeId), eq(productPriceRuleOptions.productId, productId), eq(productPriceRuleOptions.priceRuleId, ruleId)));
    const existingLinkIds = new Set(existingLinks.map((link) => link.optionId));
    const linksToRemove = [...existingLinkIds].filter((id) => !targetOptionIds.has(id));
    const linksToInsert = [...targetOptionIds].filter((id) => !existingLinkIds.has(id));
    if (linksToRemove.length) {
      await tx.delete(productPriceRuleOptions).where(and(eq(productPriceRuleOptions.storeId, storeId), eq(productPriceRuleOptions.productId, productId), eq(productPriceRuleOptions.priceRuleId, ruleId), inArray(productPriceRuleOptions.optionId, linksToRemove)));
    }
    if (linksToInsert.length) {
      await tx.insert(productPriceRuleOptions).values(linksToInsert.map((optionId) => ({ storeId, productId, priceRuleId: ruleId, optionId })));
    }
  }

  return {
    availabilityMode: configuration.availability.mode,
    availableDays: [...targetDays].sort((left, right) => left - right),
    optionGroups: configuration.optionGroups.map((group) => ({
      id: resolvedGroupIds.get(group.id ?? "") ?? "",
      name: group.name,
      kind: group.kind,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      options: group.options.map((option) => ({
        id: resolvedOptionIds.get(option.id ?? "") ?? "",
        name: option.name,
        priceCents: "priceCents" in option ? option.priceCents : null,
        priceDeltaCents: "priceDeltaCents" in option ? option.priceDeltaCents : 0,
        isActive: option.isActive,
        sortOrder: option.sortOrder
      }))
    })),
    priceRules: configuration.priceRules.map((rule) => ({
      id: resolvedRuleIds.get(rule.id ?? "") ?? "",
      name: rule.name,
      priceCents: rule.priceCents,
      optionIds: rule.optionIds.map((id) => resolvedOptionIds.get(id) ?? ""),
      isActive: rule.isActive,
      sortOrder: rule.sortOrder
    }))
  } satisfies ProductConfigurationDTO;
}
