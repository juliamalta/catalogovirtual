"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardSubmitButtonProps {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}
export function DashboardSubmitButton({ children, pendingLabel = "Salvando…", className = "primary-button" }: DashboardSubmitButtonProps) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}>
    {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
    {pending ? pendingLabel : children}
  </button>;
}
