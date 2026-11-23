import React, { type InputHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

export function ProductEditorSection({ title, children }: { title: string; children: ReactNode }) {
  return <section aria-label={title} className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
    <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
    {children}
  </section>;
}

export function ProductMoneyInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <span className="product-money-input relative block min-w-0">
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-normal text-ink-secondary">R$</span>
    <input {...props} inputMode="decimal" />
  </span>;
}

interface ProductEditorActionsProps {
  pending: boolean;
  submit: string;
  cancelHref: string;
}

export function ProductEditorActions({ pending, submit, cancelHref }: ProductEditorActionsProps) {
  return <div className="flex items-center justify-end gap-2">
    {pending ? <span className="secondary-button opacity-50" aria-disabled="true">Cancelar</span> : <Link href={cancelHref} className="secondary-button">Cancelar</Link>}
    <button type="submit" className="primary-button" disabled={pending}>
      {pending ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : <Save size={16} aria-hidden="true" />}
      {pending ? "Salvando…" : submit}
    </button>
  </div>;
}
