"use client";
import { useEffect, useState } from "react";
import type { CartLine, StoreDemo, StoreProduct } from "@/types/store.types";
import { resolveCartAddition, type CartAddition } from "@/features/cart/product-selection";
import { reconcileCart } from "@/features/cart/cart-reconciliation";
import { availableFulfillmentModes, defaultDeliveryConfiguration, type FulfillmentMode } from "@/features/cart/checkout";
const storageKey = (slug: string) => `vitrix:cart:${slug}`;
const fulfillmentKey = (slug: string) => `vitrix:fulfillment:${slug}`;
export function addCartLine(lines: CartLine[], product: StoreProduct, option?: string, note?: string, addition?: CartAddition): CartLine[] {
  const resolved = resolveCartAddition(product, option, addition);
  const cleanNote = note?.trim() || undefined;
  const existing = lines.find((line) => line.product.id === product.id && line.option === resolved.option &&
    line.note === cleanNote && JSON.stringify(line.selections ?? null) === JSON.stringify(resolved.selections ?? null));
  const key = existing?.key ?? JSON.stringify([product.id, resolved.identity, cleanNote ?? ""]);
  return existing ? lines.map((line) => line.key === key ? { ...line, product: resolved.product, quantity: line.quantity + resolved.quantity } : line) : [...lines, { key, product: resolved.product, quantity: resolved.quantity, ...(resolved.option ? { option: resolved.option } : {}), ...(resolved.selections ? { selections: resolved.selections } : {}), ...(cleanNote ? { note: cleanNote } : {}) }];
}
export function changeCartQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (!Number.isSafeInteger(quantity)) return lines;
  return quantity < 1 ? lines.filter((line) => line.key !== key) : lines.map((line) => line.key === key ? { ...line, quantity } : line);
}
export function useCart(store: StoreDemo) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<FulfillmentMode | null>(null);
  const modes = availableFulfillmentModes(store.delivery ?? defaultDeliveryConfiguration);
  const fulfillmentMode = selectedMode !== null && modes.includes(selectedMode) ? selectedMode : modes[0] ?? null;
  useEffect(() => {
    let savedLines: CartLine[] = [];
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey(store.slug)) ?? "[]");
      savedLines = reconcileCart(saved, store.products);
      setNotice(JSON.stringify(saved) !== JSON.stringify(savedLines) ? "Seu pedido foi atualizado conforme os produtos e preços atuais. Confira os itens antes de continuar." : null);
    } catch { /* Keep the cart usable when browser storage is unavailable. */ }
    setLines(savedLines);
    let savedMode: FulfillmentMode | null = null;
    try {
      const value = localStorage.getItem(fulfillmentKey(store.slug));
      if (value === "DELIVERY" || value === "PICKUP") savedMode = value;
    } catch { /* Keep the selection usable when browser storage is unavailable. */ }
    setSelectedMode(savedMode);
    setLoadedSlug(store.slug);
  }, [store.slug, store.products]);
  useEffect(() => {
    if (loadedSlug !== store.slug) return;
    try { localStorage.setItem(storageKey(store.slug), JSON.stringify(lines)); }
    catch { /* In-memory operations still work if browser storage is blocked. */ }
  }, [lines, loadedSlug, store.slug]);
  useEffect(() => {
    if (loadedSlug !== store.slug) return;
    try {
      if (fulfillmentMode) localStorage.setItem(fulfillmentKey(store.slug), fulfillmentMode);
      else localStorage.removeItem(fulfillmentKey(store.slug));
    } catch { /* In-memory selection still works if browser storage is blocked. */ }
  }, [fulfillmentMode, loadedSlug, store.slug]);
  const add = (product: StoreProduct, option?: string, note?: string, addition?: CartAddition) => {
    resolveCartAddition(product, option, addition);
    setNotice(null);
    setLines((current) => addCartLine(current, product, option, note, addition));
  };
  const setQuantity = (key: string, quantity: number) => setLines((current) => changeCartQuantity(current, key, quantity));
  const clear = () => { setLines([]); setNotice(null); };
  return { lines, add, setQuantity, clear, fulfillmentMode, setFulfillmentMode: setSelectedMode, ...(notice ? { reconciliationNotice: notice } : {}), count: lines.reduce((sum, line) => sum + line.quantity, 0), totalCents: lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0) };
}
