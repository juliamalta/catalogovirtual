import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { HowItWorksProps } from "./how-it-works.types";

export function HowItWorks({ title, description, actionHref, steps }: HowItWorksProps) {
  return (
    <section id="como-funciona" className="how-section section-pad">
      <div className="container how-grid">
        <div className="how-intro">
          <div className="eyebrow">DO SEU PRODUTO AO SEU CLIENTE</div>
          <h2>{title}</h2>
          <p>{description}</p>
          <Link className="button button-dark" href={actionHref}>
            Começar minha loja <ArrowRight size={16} />
          </Link>
          <div className="how-doodle" aria-hidden="true">
            ✳
          </div>
        </div>
        <div className="step-list">
          {steps.map((step) => (
            <div className="step-row" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <span className="step-plus" aria-hidden="true">
                <Plus size={15} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
