import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function DashboardEmptyState({ icon: Icon, title, description, action }: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-empty-state">
      <span className="dashboard-empty-icon"><Icon size={23} strokeWidth={1.7} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="dashboard-empty-action">{action}</div>}
    </div>
  );
}
