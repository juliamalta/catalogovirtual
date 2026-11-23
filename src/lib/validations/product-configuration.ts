import { z } from "zod";

const MAX_CENTS = 2_147_483_647;
const optionNameSchema = z.string().trim().min(1).max(100);
const groupNameSchema = z.string().trim().min(1).max(80);
const sortOrderSchema = z.number().int().min(0).max(100_000);
const idSchema = z.string().uuid();
const priceCentsSchema = z.number().int().min(0).max(MAX_CENTS);

const groupFields = {
  id: idSchema.optional(),
  name: groupNameSchema,
  sortOrder: sortOrderSchema.default(0),
  isActive: z.boolean().default(true)
};

const variantGroupSchema = z.object({
  ...groupFields,
  kind: z.literal("VARIANT"),
  isRequired: z.literal(true).default(true),
  minSelections: z.literal(1).default(1),
  maxSelections: z.literal(1).default(1),
  options: z.array(z.object({
    id: idSchema.optional(),
    name: optionNameSchema,
    priceCents: priceCentsSchema,
    priceDeltaCents: z.literal(0).default(0),
    sortOrder: sortOrderSchema.default(0),
    isActive: z.boolean().default(true)
  })).min(1).max(50)
}).superRefine((group, context) => {
  const names = group.options.map((option) => option.name.toLocaleLowerCase("pt-BR"));
  if (new Set(names).size !== names.length) {
    context.addIssue({ code: "custom", path: ["options"], message: "As opções do grupo precisam ter nomes diferentes." });
  }
  if (!group.options.some((option) => option.isActive)) {
    context.addIssue({ code: "custom", path: ["options"], message: "Mantenha ao menos uma variação ativa." });
  }
});

const customizationGroupSchema = z.object({
  ...groupFields,
  kind: z.literal("CUSTOMIZATION"),
  isRequired: z.boolean().default(false),
  minSelections: z.number().int().min(0).max(50).default(0),
  maxSelections: z.number().int().min(1).max(50).default(1),
  options: z.array(z.object({
    id: idSchema.optional(),
    name: optionNameSchema,
    priceDeltaCents: priceCentsSchema.default(0),
    sortOrder: sortOrderSchema.default(0),
    isActive: z.boolean().default(true)
  })).min(1).max(50)
}).superRefine((group, context) => {
  if (group.minSelections > group.maxSelections) {
    context.addIssue({ code: "custom", path: ["minSelections"], message: "O mínimo não pode ser maior que o máximo." });
  }
  if (group.maxSelections > group.options.length) {
    context.addIssue({ code: "custom", path: ["maxSelections"], message: "O máximo não pode ser maior que a quantidade de opções." });
  }
  const names = group.options.map((option) => option.name.toLocaleLowerCase("pt-BR"));
  if (new Set(names).size !== names.length) {
    context.addIssue({ code: "custom", path: ["options"], message: "As opções do grupo precisam ter nomes diferentes." });
  }
  if (group.options.filter((option) => option.isActive).length < group.minSelections) {
    context.addIssue({ code: "custom", path: ["options"], message: "O grupo não tem opções ativas suficientes para atender ao mínimo." });
  }
  if (group.isRequired !== (group.minSelections > 0)) {
    context.addIssue({ code: "custom", path: ["isRequired"], message: "Um grupo obrigatório precisa ter pelo menos uma seleção mínima." });
  }
});

export const productOptionGroupInputSchema = z.discriminatedUnion("kind", [variantGroupSchema, customizationGroupSchema]);

export const productAvailabilityInputSchema = z.object({
  mode: z.enum(["ALWAYS", "WEEKDAYS"]),
  /** ISO weekday numbering: Monday = 1 through Sunday = 7. */
  days: z.array(z.number().int().min(1).max(7)).max(7).default([])
}).superRefine((availability, context) => {
  if (new Set(availability.days).size !== availability.days.length) {
    context.addIssue({ code: "custom", path: ["days"], message: "Não repita dias da semana." });
  }
  if (availability.mode === "WEEKDAYS" && availability.days.length === 0) {
    context.addIssue({ code: "custom", path: ["days"], message: "Selecione ao menos um dia disponível." });
  }
  if (availability.mode === "ALWAYS" && availability.days.length > 0) {
    context.addIssue({ code: "custom", path: ["days"], message: "Remova os dias ou selecione disponibilidade por dia." });
  }
});

export const productPriceRuleInputSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1).max(120),
  priceCents: priceCentsSchema,
  optionIds: z.array(idSchema).min(1).max(50),
  sortOrder: sortOrderSchema.default(0),
  isActive: z.boolean().default(true)
}).superRefine((rule, context) => {
  if (new Set(rule.optionIds).size !== rule.optionIds.length) {
    context.addIssue({ code: "custom", path: ["optionIds"], message: "A combinação não pode repetir opções." });
  }
});

export const productConfigurationInputSchema = z.object({
  availability: productAvailabilityInputSchema,
  optionGroups: z.array(productOptionGroupInputSchema).max(20).default([]),
  priceRules: z.array(productPriceRuleInputSchema).max(500).default([])
}).superRefine((configuration, context) => {
  const groupNames = configuration.optionGroups.map((group) => group.name.toLocaleLowerCase("pt-BR"));
  if (new Set(groupNames).size !== groupNames.length) {
    context.addIssue({ code: "custom", path: ["optionGroups"], message: "Os grupos precisam ter nomes diferentes." });
  }

  const groupIds = configuration.optionGroups.flatMap((group) => group.id ? [group.id] : []);
  if (new Set(groupIds).size !== groupIds.length) {
    context.addIssue({ code: "custom", path: ["optionGroups"], message: "Há identificadores de grupo repetidos." });
  }

  const allOptionIds = configuration.optionGroups.flatMap((group) => group.options.flatMap((option) => option.id ? [option.id] : []));
  if (new Set(allOptionIds).size !== allOptionIds.length) {
    context.addIssue({ code: "custom", path: ["optionGroups"], message: "Há identificadores de opção repetidos." });
  }
  const optionIds = new Set(allOptionIds);
  const optionToGroup = new Map<string, { group: ProductOptionGroupInput; active: boolean }>();
  for (const group of configuration.optionGroups) {
    for (const option of group.options) {
      if (option.id) optionToGroup.set(option.id, { group, active: group.isActive && option.isActive });
    }
  }
  const seenCombinations = new Set<string>();
  const activeRules: Array<{ optionIds: string[]; index: number }> = [];
  configuration.priceRules.forEach((rule, index) => {
    if (rule.optionIds.some((optionId) => !optionIds.has(optionId))) {
      context.addIssue({ code: "custom", path: ["priceRules", index, "optionIds"], message: "A combinação referencia uma opção inexistente." });
    }
    const selectionsByGroup = new Map<string, number>();
    for (const optionId of rule.optionIds) {
      const reference = optionToGroup.get(optionId);
      if (!reference) continue;
      if (!reference.active) {
        context.addIssue({ code: "custom", path: ["priceRules", index, "optionIds"], message: "Uma combinação não pode usar grupos ou opções inativos." });
      }
      const groupKey = reference.group.id ?? reference.group.name;
      selectionsByGroup.set(groupKey, (selectionsByGroup.get(groupKey) ?? 0) + 1);
    }
    for (const [groupKey, selectedCount] of selectionsByGroup) {
      const group = configuration.optionGroups.find((item) => (item.id ?? item.name) === groupKey);
      if (group && selectedCount > group.maxSelections) {
        context.addIssue({ code: "custom", path: ["priceRules", index, "optionIds"], message: "A combinação seleciona opções incompatíveis do mesmo grupo." });
      }
    }
    const key = [...rule.optionIds].sort().join(":");
    if (seenCombinations.has(key)) {
      context.addIssue({ code: "custom", path: ["priceRules", index, "optionIds"], message: "Já existe uma regra para esta combinação." });
    }
    seenCombinations.add(key);
    if (rule.isActive) activeRules.push({ optionIds: rule.optionIds, index });
  });

  for (let first = 0; first < activeRules.length; first += 1) {
    for (let second = first + 1; second < activeRules.length; second += 1) {
      const left = activeRules[first];
      const right = activeRules[second];
      const combined = new Set([...left.optionIds, ...right.optionIds]);
      const selectionsByGroup = new Map<string, number>();
      for (const optionId of combined) {
        const reference = optionToGroup.get(optionId);
        if (!reference) continue;
        const groupKey = reference.group.id ?? reference.group.name;
        selectionsByGroup.set(groupKey, (selectionsByGroup.get(groupKey) ?? 0) + 1);
      }
      const mutuallyExclusive = [...selectionsByGroup].some(([groupKey, count]) => {
        const group = configuration.optionGroups.find((item) => (item.id ?? item.name) === groupKey);
        return group !== undefined && count > group.maxSelections;
      });
      if (!mutuallyExclusive) {
        context.addIssue({ code: "custom", path: ["priceRules", right.index, "optionIds"], message: "As combinações de preço podem ser aplicadas ao mesmo pedido. Torne-as mutuamente exclusivas." });
      }
    }
  }
});

export const productTypeSchema = z.enum(["SIMPLE", "VARIATIONS", "BUILDABLE"]);

export const productConfigurationDeletionSchema = z.object({
  groupIds: z.array(idSchema).max(20).default([]),
  optionIds: z.array(idSchema).max(1_000).default([]),
  priceRuleIds: z.array(idSchema).max(500).default([])
}).superRefine((deletions, context) => {
  for (const key of ["groupIds", "optionIds", "priceRuleIds"] as const) {
    if (new Set(deletions[key]).size !== deletions[key].length) {
      context.addIssue({ code: "custom", path: [key], message: "A lista de exclusões contém identificadores repetidos." });
    }
  }
});

export const productEditorConfigurationSchema = z.object({
  productType: productTypeSchema,
  configuration: productConfigurationInputSchema
}).superRefine(({ productType, configuration }, context) => {
  const variantGroups = configuration.optionGroups.filter((group) => group.kind === "VARIANT");
  const customizationGroups = configuration.optionGroups.filter((group) => group.kind === "CUSTOMIZATION");
  if (variantGroups.length > 1) {
    context.addIssue({ code: "custom", path: ["configuration", "optionGroups"], message: "Configure no máximo um grupo de variações." });
  }
  if (productType === "SIMPLE" && (configuration.optionGroups.length > 0 || configuration.priceRules.length > 0)) {
    context.addIssue({ code: "custom", path: ["configuration", "optionGroups"], message: "Produto simples não pode ter grupos ou regras de preço." });
  }
  if (productType === "VARIATIONS" && (variantGroups.length !== 1 || customizationGroups.length > 0 || configuration.priceRules.length > 0)) {
    context.addIssue({ code: "custom", path: ["configuration", "optionGroups"], message: "Produto com variações precisa de um grupo de variações, sem grupos adicionais ou regras de combinação." });
  }
  if (productType === "BUILDABLE" && customizationGroups.length === 0) {
    context.addIssue({ code: "custom", path: ["configuration", "optionGroups"], message: "Produto montável precisa de ao menos um grupo de escolhas." });
  }
  if (productType !== "BUILDABLE" && configuration.priceRules.length > 0) {
    context.addIssue({ code: "custom", path: ["configuration", "priceRules"], message: "Regras de combinação são permitidas somente em produtos montáveis." });
  }
});

export type ProductOptionGroupInput = z.infer<typeof productOptionGroupInputSchema>;
export type ProductConfigurationInput = z.infer<typeof productConfigurationInputSchema>;
export type ProductConfigurationDeletions = z.infer<typeof productConfigurationDeletionSchema>;
