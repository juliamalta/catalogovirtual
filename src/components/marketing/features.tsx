import { Check, MessageCircle, Sparkles, Store } from "lucide-react";
import type { LandingFeature } from "@/features/marketing/landing.types";
import type { FeaturesProps } from "./features.types";

const featureIcons: Record<LandingFeature["icon"], React.ReactNode> = {
  store: <Store size={18} />,
  message: <MessageCircle size={18} />,
  sparkles: <Sparkles size={18} />,
  check: <Check size={18} />,
};

export function Features({ title, description, features }: FeaturesProps) {
  return (
    <section id="sobre" className="scroll-mt-24 bg-canvas px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">O essencial, bem organizado</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">{title}</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-secondary">{description}</p>
          </div>
          <div className="grid border-t border-line sm:grid-cols-2">
            {features.map((feature, index) => (
              <article className={`border-b border-line py-5 sm:py-6 ${index % 2 === 0 ? "sm:pr-7" : "sm:pl-7"}`} key={feature.title}>
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-surface text-brand ring-1 ring-line">{featureIcons[feature.icon]}</span><span className="text-xs font-semibold tabular-nums text-ink-secondary">0{index + 1}</span></div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-secondary">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
