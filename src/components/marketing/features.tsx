import { Check, MessageCircle, Sparkles, Store } from "lucide-react";
import type { LandingFeature } from "@/features/marketing/landing.types";
import type { FeaturesProps } from "./features.types";

const featureIcons: Record<LandingFeature["icon"], React.ReactNode> = {
  store: <Store />,
  message: <MessageCircle />,
  sparkles: <Sparkles />,
  check: <Check />,
};

export function Features({ title, description, features }: FeaturesProps) {
  return (
    <section id="sobre" className="features-section">
      <div className="container features-inner">
        <div className="features-heading">
          <div className="eyebrow">O ESSENCIAL, BEM ORGANIZADO</div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <div className="feature-item" key={feature.title}>
              <span className="feature-icon">{featureIcons[feature.icon]}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
