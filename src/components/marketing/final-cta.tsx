import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FinalCTAProps } from "./final-cta.types";

export function FinalCTA({ title, description, href, label }: FinalCTAProps) {
  return (
    <section className="closing-section">
      <div className="container closing-card">
        <div className="closing-spark" aria-hidden="true">
          ✳
        </div>
        <div className="eyebrow">SUA PRÓXIMA HISTÓRIA COMEÇA AQUI</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link className="button button-white" href={href}>
          {label} <ArrowRight size={17} />
        </Link>
        <div className="closing-flower" aria-hidden="true">
          ✳
        </div>
      </div>
    </section>
  );
}
