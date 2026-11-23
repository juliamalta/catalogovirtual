"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Plus, Trash2 } from "lucide-react";
import { ProductEditorSection, ProductMoneyInput } from "./product-editor-fields";
import type { ProductConfigurationDTO, ProductType } from "@/types/product-configuration.types";

const weekdays = [
  { value: 1, label: "Seg" }, { value: 2, label: "Ter" }, { value: 3, label: "Qua" },
  { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" }, { value: 7, label: "Dom" }
];

interface EditableOption {
  id: string;
  name: string;
  priceCents: string;
  priceDeltaCents: string;
  isActive: boolean;
  sortOrder: number;
}

interface EditableGroup {
  id: string;
  name: string;
  kind: "VARIANT" | "CUSTOMIZATION";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  sortOrder: number;
  options: EditableOption[];
}

interface EditableRule {
  id: string;
  name: string;
  priceCents: string;
  optionIds: string[];
  isActive: boolean;
  sortOrder: number;
}

interface EditableConfiguration {
  availabilityMode: "ALWAYS" | "WEEKDAYS";
  availableDays: number[];
  optionGroups: EditableGroup[];
  priceRules: EditableRule[];
}

interface ProductConfigurationEditorProps {
  productType: ProductType;
  basicFields: ReactNode;
  basePriceField: ReactNode;
  simpleOptionsField: ReactNode;
  imageFields: ReactNode;
  availabilityFields: ReactNode;
  initialConfiguration?: ProductConfigurationDTO;
  onProductTypeChange: (type: ProductType) => void;
}

function toMoneyText(cents: number | null | undefined) {
  return cents === null || cents === undefined ? "" : `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

function moneyToCents(value: string): number | undefined {
  const match = value.trim().match(/^(\d{1,7})(?:,(\d{1,2}))?$/);
  if (!match) return undefined;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

function displayMoney(cents: number | undefined) {
  if (cents === undefined) return "Preço pendente";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fromConfiguration(value?: ProductConfigurationDTO): EditableConfiguration {
  return {
    availabilityMode: value?.availabilityMode ?? "ALWAYS",
    availableDays: value?.availableDays ?? [],
    optionGroups: (value?.optionGroups ?? []).map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        priceCents: toMoneyText(option.priceCents),
        priceDeltaCents: toMoneyText(option.priceDeltaCents)
      }))
    })),
    priceRules: (value?.priceRules ?? []).map((rule) => ({ ...rule, priceCents: toMoneyText(rule.priceCents) }))
  };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

function makeGroup(kind: EditableGroup["kind"], sortOrder: number): EditableGroup {
  return {
    id: crypto.randomUUID(), name: "", kind,
    isRequired: kind === "VARIANT", minSelections: kind === "VARIANT" ? 1 : 0,
    maxSelections: 1, isActive: true, sortOrder,
    options: [{ id: crypto.randomUUID(), name: "", priceCents: "", priceDeltaCents: "0,00", isActive: true, sortOrder: 0 }]
  };
}

function makeRule(sortOrder: number): EditableRule {
  return { id: crypto.randomUUID(), name: "", priceCents: "", optionIds: [], isActive: true, sortOrder };
}

export function ProductConfigurationEditor({ productType, initialConfiguration, onProductTypeChange, basicFields, basePriceField, simpleOptionsField, imageFields, availabilityFields }: ProductConfigurationEditorProps) {
  const [configuration, setConfiguration] = useState(() => fromConfiguration(initialConfiguration));
  const [originalIds] = useState(() => ({
    groupIds: new Set(initialConfiguration?.optionGroups.map((group) => group.id) ?? []),
    optionIds: new Set(initialConfiguration?.optionGroups.flatMap((group) => group.options.map((option) => option.id)) ?? []),
    priceRuleIds: new Set(initialConfiguration?.priceRules.map((rule) => rule.id) ?? [])
  }));
  const [deletions, setDeletions] = useState<{ groupIds: string[]; optionIds: string[]; priceRuleIds: string[] }>({ groupIds: [], optionIds: [], priceRuleIds: [] });

  const serialized = useMemo(() => JSON.stringify({
    availability: { mode: configuration.availabilityMode, days: configuration.availableDays },
    optionGroups: configuration.optionGroups.map((group) => ({
      id: group.id, name: group.name, kind: group.kind, isRequired: group.isRequired,
      minSelections: group.minSelections, maxSelections: group.maxSelections,
      isActive: group.isActive, sortOrder: group.sortOrder,
      options: group.options.map((option) => ({
        id: option.id, name: option.name, sortOrder: option.sortOrder, isActive: option.isActive,
        ...(group.kind === "VARIANT"
          ? { priceCents: moneyToCents(option.priceCents), priceDeltaCents: 0 }
          : { priceDeltaCents: option.priceDeltaCents.trim() ? moneyToCents(option.priceDeltaCents) ?? null : 0 })
      }))
    })),
    priceRules: configuration.priceRules.map((rule) => ({
      id: rule.id, name: rule.name, priceCents: moneyToCents(rule.priceCents),
      optionIds: rule.optionIds, isActive: rule.isActive, sortOrder: rule.sortOrder
    }))
  }), [configuration]);

  const updateGroup = (groupId: string, update: (group: EditableGroup) => EditableGroup) => {
    setConfiguration((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId ? update(group) : group)
    }));
  };

  const addGroup = (kind: EditableGroup["kind"]) => {
    setConfiguration((current) => ({ ...current, optionGroups: [...current.optionGroups, makeGroup(kind, current.optionGroups.length)] }));
  };

  const recordDeleted = (key: "groupIds" | "optionIds" | "priceRuleIds", ids: string[]) => {
    const knownIds = originalIds[key];
    setDeletions((current) => ({
      ...current,
      [key]: [...new Set([...current[key], ...ids.filter((id) => knownIds.has(id))])]
    }));
  };

  const selectType = (nextType: ProductType) => {
    if (nextType === productType) return;
    const hasConfiguration = configuration.optionGroups.length > 0 || configuration.priceRules.length > 0;
    if (nextType === "SIMPLE" && hasConfiguration && !window.confirm("Trocar para produto simples removerá as variações, grupos e regras de preço. Continuar?")) return;
    if (nextType === "VARIATIONS" && (configuration.optionGroups.some((group) => group.kind !== "VARIANT") || configuration.priceRules.length > 0) && !window.confirm("A opção Produto com variações remove grupos de escolhas e regras de preço. Continuar?")) return;
    const removedGroups = nextType === "SIMPLE"
      ? configuration.optionGroups
      : nextType === "VARIATIONS"
        ? configuration.optionGroups.filter((group) => group.kind !== "VARIANT")
        : [];
    recordDeleted("groupIds", removedGroups.map((group) => group.id));
    recordDeleted("optionIds", removedGroups.flatMap((group) => group.options.map((option) => option.id)));
    if (nextType !== "BUILDABLE") recordDeleted("priceRuleIds", configuration.priceRules.map((rule) => rule.id));
    if (nextType === "SIMPLE") {
      setConfiguration((current) => ({ ...current, optionGroups: [], priceRules: [] }));
    } else if (nextType === "VARIATIONS") {
      setConfiguration((current) => {
        const variant = current.optionGroups.find((group) => group.kind === "VARIANT") ?? makeGroup("VARIANT", 0);
        return { ...current, optionGroups: [{ ...variant, sortOrder: 0 }], priceRules: [] };
      });
    }
    onProductTypeChange(nextType);
  };

  const activeVariantPrices = configuration.optionGroups
    .filter((group) => group.kind === "VARIANT" && group.isActive)
    .flatMap((group) => group.options.filter((option) => option.isActive).map((option) => moneyToCents(option.priceCents)))
    .filter((value): value is number => value !== undefined);
  const minimumVariationPrice = activeVariantPrices.length ? Math.min(...activeVariantPrices) : undefined;

  const renderGroup = (group: EditableGroup) => {
    const groupIndex = configuration.optionGroups.findIndex((item) => item.id === group.id);
    return (
            <section key={group.id} className="rounded-lg border border-line bg-surface p-3" aria-label={group.kind === "VARIANT" ? "Grupo de variações" : "Grupo de escolhas"}>
              <div className="flex flex-wrap items-end gap-3">
                <label className="field min-w-0 basis-40 flex-1">Nome do grupo<input required maxLength={80} value={group.name} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, name: event.target.value }))} placeholder={group.kind === "VARIANT" ? "Ex.: Tamanho" : "Ex.: Escolha uma proteína"} /></label>
                <div className="flex gap-1 pb-1">
                  <button type="button" className="icon-button" aria-label="Mover grupo para cima" disabled={groupIndex === 0} onClick={() => setConfiguration((current) => ({ ...current, optionGroups: moveItem(current.optionGroups, groupIndex, -1).map((item, index) => ({ ...item, sortOrder: index })) }))}><ArrowUp size={16} /></button>
                  <button type="button" className="icon-button" aria-label="Mover grupo para baixo" disabled={groupIndex === configuration.optionGroups.length - 1} onClick={() => setConfiguration((current) => ({ ...current, optionGroups: moveItem(current.optionGroups, groupIndex, 1).map((item, index) => ({ ...item, sortOrder: index })) }))}><ArrowDown size={16} /></button>
                  <button type="button" className="icon-button text-error" aria-label="Remover grupo" onClick={() => { recordDeleted("groupIds", [group.id]); recordDeleted("optionIds", group.options.map((option) => option.id)); setConfiguration((current) => ({ ...current, optionGroups: current.optionGroups.filter((item) => item.id !== group.id), priceRules: current.priceRules.map((rule) => ({ ...rule, optionIds: rule.optionIds.filter((id) => !group.options.some((option) => option.id === id)) })) })); }}><Trash2 size={16} /></button>
                </div>
              </div>

              {group.kind === "CUSTOMIZATION" && <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="dashboard-checkbox-field"><input type="checkbox" checked={group.isRequired} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, isRequired: event.target.checked, minSelections: event.target.checked ? Math.max(1, current.minSelections) : 0 }))} /><span><strong>Obrigatório</strong><small>O cliente precisa fazer uma escolha.</small></span></label>
                <label className="field">Mínimo de escolhas<input type="number" min={group.isRequired ? 1 : 0} max={group.maxSelections} value={group.minSelections} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, minSelections: Number(event.target.value), isRequired: Number(event.target.value) > 0 }))} /></label>
                <label className="field">Máximo de escolhas<input type="number" min={1} max={50} value={group.maxSelections} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, maxSelections: Number(event.target.value) }))} /></label>
              </div>}

              <div className="mt-3 space-y-2">
                {group.options.map((option, optionIndex) => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_minmax(90px,120px)] gap-2 rounded-lg bg-canvas p-2 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-end">
                  <label className="field">{group.kind === "VARIANT" ? "Variação" : "Opção"}<input required maxLength={100} value={option.name} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, options: current.options.map((item) => item.id === option.id ? { ...item, name: event.target.value } : item) }))} placeholder={group.kind === "VARIANT" ? "Ex.: Pequena" : "Nome da escolha"} /></label>
                  <label className="field">{group.kind === "VARIANT" ? "Preço" : "Adicional"}<ProductMoneyInput required inputMode="decimal" value={group.kind === "VARIANT" ? option.priceCents : option.priceDeltaCents} onChange={(event) => updateGroup(group.id, (current) => ({ ...current, options: current.options.map((item) => item.id === option.id ? { ...item, [group.kind === "VARIANT" ? "priceCents" : "priceDeltaCents"]: event.target.value } : item) }))}  placeholder="0,00" /></label>
                  <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                    <button type="button" className="icon-button" aria-label="Mover opção para cima" disabled={optionIndex === 0} onClick={() => updateGroup(group.id, (current) => ({ ...current, options: moveItem(current.options, optionIndex, -1).map((item, index) => ({ ...item, sortOrder: index })) }))}><ArrowUp size={16} /></button>
                    <button type="button" className="icon-button" aria-label="Mover opção para baixo" disabled={optionIndex === group.options.length - 1} onClick={() => updateGroup(group.id, (current) => ({ ...current, options: moveItem(current.options, optionIndex, 1).map((item, index) => ({ ...item, sortOrder: index })) }))}><ArrowDown size={16} /></button>
                    <button type="button" className="icon-button text-error" aria-label="Remover opção" disabled={group.options.length === 1} onClick={() => { recordDeleted("optionIds", [option.id]); updateGroup(group.id, (current) => ({ ...current, options: current.options.filter((item) => item.id !== option.id), maxSelections: current.kind === "CUSTOMIZATION" ? Math.max(1, Math.min(current.maxSelections, current.options.length - 1)) : 1, minSelections: current.kind === "CUSTOMIZATION" ? Math.min(current.minSelections, current.options.length - 1) : 1 })); }}><Trash2 size={16} /></button>
                  </div>
                </div>)}
                <button type="button" className="secondary-button" onClick={() => updateGroup(group.id, (current) => ({ ...current, options: [...current.options, { id: crypto.randomUUID(), name: "", priceCents: "", priceDeltaCents: "0,00", isActive: true, sortOrder: current.options.length }], maxSelections: current.kind === "CUSTOMIZATION" ? Math.min(50, current.maxSelections + 1) : 1 }))}><Plus size={16} /> Adicionar opção</button>
              </div>
            </section>
          );
  };

  return (
    <>
    <ProductEditorSection title="Tipo de produto">
      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="productConfiguration" value={serialized} />
      <input type="hidden" name="productConfigurationDeletes" value={JSON.stringify(deletions)} />

      <fieldset className="grid gap-2 sm:grid-cols-3" aria-label="Tipo de produto">
        {([
          ["SIMPLE", "Simples", "Preço único"],
          ["VARIATIONS", "Com variações", "Tamanhos e versões"],
          ["BUILDABLE", "Montável", "Escolhas e adicionais"]
        ] as const).map(([value, title, description]) => (
          <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-brand ${productType === value ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-ink-secondary/50"}`}>
            <span className="flex items-center gap-2">
              <input type="radio" name="productTypeChoice" value={value} checked={productType === value} onChange={() => selectType(value)} className="accent-brand" />
              <span><strong className="block text-sm text-ink">{title}</strong><small className="block text-xs font-normal leading-4 text-ink-secondary-strong">{description}</small></span>
            </span>
          </label>
        ))}
      </fieldset>
    </ProductEditorSection>
    <ProductEditorSection title="Informações básicas">{basicFields}</ProductEditorSection>
    <ProductEditorSection title="Preços e variações">
      {basePriceField}
      {productType === "VARIATIONS" && <p className="mb-3 text-xs text-ink-secondary" aria-live="polite">Preço base a partir da menor variação ativa: <strong className="text-brand-dark">{displayMoney(minimumVariationPrice)}</strong></p>}
      {(productType === "VARIATIONS" || productType === "BUILDABLE") && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-ink-secondary-strong">Tamanhos e versões</h3>
            <div className="flex flex-wrap gap-2">
              {productType === "BUILDABLE" && !configuration.optionGroups.some((group) => group.kind === "VARIANT") && <button type="button" className="secondary-button" onClick={() => addGroup("VARIANT")}><Plus size={16} /> Adicionar variação</button>}
              {productType === "VARIATIONS" && !configuration.optionGroups.some((group) => group.kind === "VARIANT") && <button type="button" className="secondary-button" onClick={() => addGroup("VARIANT")}><Plus size={16} /> Adicionar variação</button>}
            </div>
          </div>

          {configuration.optionGroups.filter((group) => group.kind === "VARIANT").map(renderGroup)}

        </div>
      )}
    </ProductEditorSection>
    <ProductEditorSection title="Personalizações">
      {productType === "SIMPLE" ? <details><summary className="cursor-pointer text-sm font-medium text-brand-dark">Opções sem alteração de preço</summary><div className="mt-3">{simpleOptionsField}</div></details> : productType === "VARIATIONS" ? <p className="text-xs text-ink-secondary">Cada tamanho ou versão tem seu próprio preço. Para adicionar grupos de escolhas, use o tipo Montável.</p> : <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-ink-secondary">Proteínas, acompanhamentos e adicionais.</p><button type="button" className="secondary-button" onClick={() => addGroup("CUSTOMIZATION")}><Plus size={16} /> Adicionar grupo</button></div>
        {configuration.optionGroups.filter((group) => group.kind === "CUSTOMIZATION").map(renderGroup)}
      </div>}
          {productType === "BUILDABLE" && <details className="mt-3 rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-semibold text-brand-dark">Avançado: preços por combinação ({configuration.priceRules.length})</summary><div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-ink">Preços por combinação</h3><p className="text-sm text-ink-secondary-strong">Uma regra define o preço fixo para as escolhas marcadas. Adicionais fora da combinação são somados uma vez.</p></div><button type="button" className="secondary-button" onClick={() => setConfiguration((current) => ({ ...current, priceRules: [...current.priceRules, makeRule(current.priceRules.length)] }))}><Plus size={16} /> Adicionar combinação</button></div>
            {configuration.priceRules.length === 0 && <p className="mt-4 rounded-lg bg-canvas p-3 text-sm text-ink-secondary-strong">Sem combinações cadastradas. O preço será composto pelo valor base, variação selecionada e adicionais.</p>}
            <div className="mt-4 space-y-4">
              {configuration.priceRules.map((rule, index) => {
                const selectedByGroup = new Map<string, number>();
                for (const id of rule.optionIds) for (const group of configuration.optionGroups) if (group.options.some((option) => option.id === id)) selectedByGroup.set(group.id, (selectedByGroup.get(group.id) ?? 0) + 1);
                return <div key={rule.id} className="rounded-lg bg-canvas p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-end">
                    <label className="field">Nome da combinação<input required maxLength={120} value={rule.name} onChange={(event) => setConfiguration((current) => ({ ...current, priceRules: current.priceRules.map((item) => item.id === rule.id ? { ...item, name: event.target.value } : item) }))} placeholder="Ex.: tamanho com proteína" /></label>
                    <label className="field">Preço final<ProductMoneyInput required inputMode="decimal"  value={rule.priceCents} onChange={(event) => setConfiguration((current) => ({ ...current, priceRules: current.priceRules.map((item) => item.id === rule.id ? { ...item, priceCents: event.target.value } : item) }))} placeholder="0,00" /></label>
                    <button type="button" className="icon-button mb-1 text-error" aria-label="Remover combinação" onClick={() => { recordDeleted("priceRuleIds", [rule.id]); setConfiguration((current) => ({ ...current, priceRules: current.priceRules.filter((item) => item.id !== rule.id) })); }}><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {configuration.optionGroups.map((group) => <fieldset key={group.id} className="rounded-lg border border-line bg-surface p-3"><legend className="px-1 text-xs font-semibold text-ink-secondary-strong">{group.name || "Grupo sem nome"}</legend><div className="space-y-2">{group.options.map((option) => {
                      const checked = rule.optionIds.includes(option.id);
                      const blocked = !checked && (selectedByGroup.get(group.id) ?? 0) >= group.maxSelections;
                      return <label key={option.id} className="flex items-center gap-2 text-sm text-ink-secondary-strong"><input type="checkbox" checked={checked} disabled={blocked} onChange={(event) => setConfiguration((current) => ({ ...current, priceRules: current.priceRules.map((item) => item.id === rule.id ? { ...item, optionIds: event.target.checked ? [...item.optionIds, option.id] : item.optionIds.filter((id) => id !== option.id) } : item) }))} className="accent-brand" /><span>{option.name || "Opção sem nome"}</span></label>;
                    })}</div></fieldset>)}
                  </div>
                  {index > 0 && <p className="mt-3 text-xs text-ink-secondary">Regras ativas precisam usar escolhas mutuamente exclusivas para evitar preços ambíguos.</p>}
                </div>;
              })}
            </div>
          </div></details>}



          {productType !== "SIMPLE" && <details className="mt-3 rounded-lg bg-brand-soft/60 p-3"><summary className="cursor-pointer text-sm font-medium text-brand-dark">Prévia da configuração</summary><div aria-live="polite">
            {productType === "VARIATIONS" && <p className="mt-2 text-sm text-ink-secondary-strong">{configuration.optionGroups[0]?.name || "Variações"}: {configuration.optionGroups[0]?.options.map((option) => option.name || "Opção sem nome").join(" · ") || "Adicione as opções do produto."}</p>}
            {productType === "BUILDABLE" && <div className="mt-2 space-y-2">{configuration.optionGroups.map((group) => <p key={group.id} className="text-sm text-ink-secondary-strong"><strong>{group.name || "Grupo sem nome"}:</strong> {group.options.map((option) => option.name || "Opção sem nome").join(" · ")}</p>)}{configuration.optionGroups.length === 0 && <p className="text-sm text-ink-secondary-strong">Adicione os grupos e opções que o cliente poderá escolher.</p>}</div>}
            {productType === "VARIATIONS" && <p className="mt-2 text-sm font-medium text-brand-hover">Preço mínimo atual: {displayMoney(minimumVariationPrice)}</p>}
            {configuration.priceRules.length > 0 && <p className="mt-2 text-sm text-ink-secondary-strong">{configuration.priceRules.length} combinação(ões) de preço configurada(s).</p>}
          </div></details>}
    </ProductEditorSection>
    <ProductEditorSection title="Imagens">{imageFields}</ProductEditorSection>
    <ProductEditorSection title="Disponibilidade">
      {availabilityFields}
        <div className="mt-4 flex items-center gap-2"><CalendarDays size={18} className="text-brand" /><div><h3 className="text-xs font-semibold text-ink-secondary-strong">Dias de venda</h3></div></div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="availabilityModeChoice" checked={configuration.availabilityMode === "ALWAYS"} onChange={() => setConfiguration((current) => ({ ...current, availabilityMode: "ALWAYS", availableDays: [] }))} className="accent-brand" /> Todos os dias</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="availabilityModeChoice" checked={configuration.availabilityMode === "WEEKDAYS"} onChange={() => setConfiguration((current) => ({ ...current, availabilityMode: "WEEKDAYS", availableDays: current.availableDays.length ? current.availableDays : [1, 2, 3, 4, 5, 6, 7] }))} className="accent-brand" /> Dias selecionados</label>
        </div>
        {configuration.availabilityMode === "WEEKDAYS" && <div className="mt-4 flex flex-wrap gap-2">{weekdays.map((day) => <label key={day.value} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-brand ${configuration.availableDays.includes(day.value) ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-secondary-strong"}`}><input type="checkbox" className="sr-only" checked={configuration.availableDays.includes(day.value)} onChange={(event) => setConfiguration((current) => ({ ...current, availableDays: event.target.checked ? [...current.availableDays, day.value].sort() : current.availableDays.filter((value) => value !== day.value) }))} />{day.label}</label>)}</div>}
    </ProductEditorSection>
    </>
  );
}
