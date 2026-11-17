import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { StoreModelsProps } from "./store-models.types";

export function StoreModels({ title, description, models }: StoreModelsProps) {
  return (
    <section id="formatos" className="formats-section section-pad">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">TRÊS JEITOS DE SE APRESENTAR</div>
            <h2>{title}</h2>
          </div>
          <p>{description}</p>
        </div>
        <div className="format-grid">
          {models.map((model, index) => (
            <Link
              className={`format-card format-${index + 1}`}
              href={model.href}
              key={model.href}
            >
              <div
                className="format-image"
                role="img"
                aria-label={`Prévia de ${model.label.toLowerCase()}`}
                style={{ backgroundImage: `url(${model.image})` }}
              >
                <span className="format-label">{model.label}</span>
                <span className="format-arrow" aria-hidden="true">
                  <ArrowUpRight size={19} />
                </span>
              </div>
              <div className="format-info">
                <div>
                  <h3>{model.title}</h3>
                  <p>{model.description}</p>
                </div>
                <span className="format-index">0{index + 1}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="format-note">
          <span>
            <Sparkles size={15} />
          </span>
          As demonstrações mostram como cada loja pode se apresentar.
        </div>
      </div>
    </section>
  );
}
