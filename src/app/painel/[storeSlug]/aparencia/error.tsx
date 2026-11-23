"use client";
import { DashboardError } from "@/components/dashboard/dashboard-error";

export default function AppearanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError reset={reset} title="Não foi possível carregar a aparência da loja" />;
}
