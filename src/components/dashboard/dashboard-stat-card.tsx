import type { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "purple" | "green" | "neutral";
}

export function DashboardStatCard({ label, value, detail, icon: Icon, tone = "purple" }: DashboardStatCardProps) {
  return (
    <article className="dashboard-stat-card">
      <span className={`dashboard-stat-icon tone-${tone}`}><Icon size={19} strokeWidth={1.8} /></span>
      <span className="dashboard-stat-label">{label}</span>
      <strong className="dashboard-stat-value">{value}</strong>
      <span className="dashboard-stat-detail">{detail}</span>
    </article>
  );
}
