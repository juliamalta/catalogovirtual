import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Brand({ light = false, name = "Catálogo Loja Virtual", markColor }: { light?: boolean; name?: string; markColor?: string }) {
  return (
    <Link href="/" className={`brand ${light ? "brand-light" : ""}`} aria-label={`${name} início`}>
      <span className="brand-mark" aria-hidden="true" style={markColor ? { backgroundColor: markColor } : undefined}>
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7 14.5 9.2 8h13.6l2.2 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 14.5c0 1.9 1.3 3.2 3 3.2s3-1.3 3-3.2c0 1.9 1.3 3.2 3 3.2s3-1.3 3-3.2c0 1.9 1.3 3.2 3 3.2s3-1.3 3-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17.7V25h14v-7.3M14 25v-5h4v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24.5 5v4M22.5 7h4" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span>{name}</span>
    </Link>
  );
}

export function DemoPill({ className = "" }: { className?: string }) {
  return <span className={`demo-pill ${className}`}><span className="demo-dot" /> LOJA DEMONSTRATIVA</span>;
}

export function DemoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="demo-link" href={href}>{children}<ArrowUpRight size={15} /></Link>;
}
