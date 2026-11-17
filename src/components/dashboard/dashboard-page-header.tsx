import type { ReactNode } from "react";
import Link from "next/link";
import { Store } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardPageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  storeName?: string;
  breadcrumb?: BreadcrumbItem[];
}

export function DashboardPageHeader({ title, description, eyebrow = "Painel da loja", actions, storeName, breadcrumb }: DashboardPageHeaderProps) {
  return (
    <header className="dashboard-page-header">
      <div className="dashboard-page-heading-wrap">
        {breadcrumb?.length ? <nav className="dashboard-header-breadcrumb" aria-label="Caminho da página">
          {breadcrumb.map((item, index) => <span key={`${item.label}-${index}`}>
            {index > 0 && <i aria-hidden="true">/</i>}
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </span>)}
        </nav> : null}
        <div className="dashboard-page-heading">
          <p className="dashboard-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="dashboard-page-description">{description}</p>
        </div>
      </div>
      <div className="dashboard-page-header-side">
        {storeName && <span className="dashboard-header-store"><Store size={15} />{storeName}</span>}
        {actions && <div className="dashboard-page-actions">{actions}</div>}
      </div>
    </header>
  );
}
