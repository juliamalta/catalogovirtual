"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import { ConfirmActionForm } from "./confirm-action-form";
import { DashboardSubmitButton } from "./dashboard-submit-button";

interface ProductActionsMenuProps { name: string; isActive: boolean; onToggle: () => Promise<void>; onRemove: () => Promise<void> }
export function ProductActionsMenu({ name, isActive, onToggle, onRemove }: ProductActionsMenuProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) { if (event.target instanceof Node && !details.current?.contains(event.target)) details.current?.removeAttribute("open"); }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return <details ref={details} className="admin-product-menu" onToggle={(event) => setOpen(event.currentTarget.open)} onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); details.current?.removeAttribute("open"); details.current?.querySelector("summary")?.focus(); }
  }}>
    <summary aria-label={`Mais ações para ${name}`}><MoreHorizontal size={20} aria-hidden="true" /></summary>
    <div className="admin-product-menu-content">
      <form action={onToggle}><DashboardSubmitButton className="admin-menu-action" pendingLabel="Atualizando…">{isActive ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{isActive ? "Ocultar da loja" : "Mostrar na loja"}</DashboardSubmitButton></form>
      <ConfirmActionForm action={onRemove} message={`Excluir “${name}”? Essa ação não pode ser desfeita.`}><DashboardSubmitButton className="admin-menu-action is-danger" pendingLabel="Excluindo…"><Trash2 size={16} aria-hidden="true" />Excluir produto</DashboardSubmitButton></ConfirmActionForm>
    </div>
  </details>;
}
