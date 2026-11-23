import React from "react";
import type { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "neutral";
  detail?: string;
}

const tones = {
  brand: "bg-brand-soft text-brand",
  neutral: "bg-canvas text-ink-secondary-strong"
};

export function DashboardStatCard({ label, value, icon: Icon, tone = "brand", detail }: DashboardStatCardProps) {
  return (
    <div className="dashboard-summary-card flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 sm:gap-4 sm:p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-11 ${tones[tone]}`}><Icon aria-hidden="true" size={20} strokeWidth={1.8} /></span>
      <dl className="min-w-0">
        <dt className="text-xs font-medium text-ink-secondary sm:text-sm">{label}</dt>
        <dd className={`dashboard-summary-value mt-0.5 break-words font-semibold leading-tight text-ink ${typeof value === "number" ? "text-2xl tabular-nums" : "text-sm sm:text-base"}`}>{value}{detail && <span className="dashboard-summary-detail">{detail}</span>}</dd>
      </dl>
    </div>
  );
}
