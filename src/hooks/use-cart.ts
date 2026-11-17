"use client";
import { useEffect, useState } from "react";
import type { CartLine, StoreDemo, StoreProduct } from "@/types/store.types";
const storageKey = (slug: string) => `vitrix:cart:${slug}`;
export function addCartLine(lines: CartLine[], product: StoreProduct, option?: string, note?: string): CartLine[] {
  const cleanNote = note?.trim() || undefined;
  const key = `${product.id}:${option ?? ""}:${cleanNote ?? ""}`;
  const existing = lines.find((line) => line.key === key);
  return existing ? lines.map((line) => line.key === key ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { key, product, quantity: 1, ...(option ? { option } : {}), ...(cleanNote ? { note: cleanNote } : {}) }];
}
export function changeCartQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  return quantity < 1 ? lines.filter((line) => line.key !== key) : lines.map((line) => line.key === key ? { ...line, quantity } : line);
}
export function useCart(store: StoreDemo) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(storageKey(store.slug)); if (saved) setLines(JSON.parse(saved) as CartLine[]); } catch { localStorage.removeItem(storageKey(store.slug)); } setReady(true); }, [store.slug]);
  useEffect(() => { if (ready) localStorage.setItem(storageKey(store.slug), JSON.stringify(lines)); }, [lines, ready, store.slug]);
  const add = (product: StoreProduct, option?: string, note?: string) => setLines((current) => addCartLine(current, product, option, note));
  const setQuantity = (key: string, quantity: number) => setLines((current) => changeCartQuantity(current, key, quantity));
  const clear = () => setLines([]);
  return { lines, add, setQuantity, clear, count: lines.reduce((sum, line) => sum + line.quantity, 0), totalCents: lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0) };
}
