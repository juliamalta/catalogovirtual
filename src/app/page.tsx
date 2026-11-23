import { Features } from "@/components/marketing/features";
import { FinalCTA } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { PricingSection } from "@/components/marketing/pricing-section";
import { StoreModels } from "@/components/marketing/store-models";
import { landingFeatures, landingSteps, landingStoreModels } from "@/features/marketing/landing-content";
import { uniquePricingPlan } from "@/features/marketing/pricing-content";
import { demoStores } from "@/features/stores/demo-data";

const brandName = "Catálogo Loja Virtual";

export default function HomePage() {
  return (
    <div className="landing font-marketing min-h-screen bg-surface text-ink antialiased">
      <Header brandName={brandName} loginHref="/login" signupHref="/cadastro" />
      <main>
        <Hero
          title={<>Sua loja online,<br /> pronta para vender.</>}
          description="Monte um cardápio, catálogo ou vitrine, compartilhe seu link. O cliente escolhe os produtos e segue para conversar com sua loja pelo WhatsApp."
          primaryHref="/cadastro"
          secondaryHref="/demonstracoes/doce-encanto"
          sampleStore={demoStores["doce-encanto"]}
        />
        <StoreModels
          title="Um formato para cada negócio."
          description="Veja como docerias, lojas de moda e marcas de casa podem apresentar seus produtos em experiências diferentes."
          models={landingStoreModels}
        />
        <HowItWorks
          title="Do cadastro ao primeiro pedido."
          description="Configure sua loja, organize os produtos e compartilhe o link com seus clientes."
          actionHref="/cadastro"
          steps={landingSteps}
        />
        <ProductShowcase store={demoStores["casa-aurora"]} href="/demonstracoes/casa-aurora" />
        <Features
          title="Tudo para colocar sua loja online."
          description="Uma presença digital simples de compartilhar e ligada ao atendimento da sua loja."
          features={landingFeatures}
        />
        <PricingSection
          title="Um plano. Tudo para sua loja online."
          description="Escolha o formato da sua loja e comece a apresentar seus produtos com uma experiência feita para o seu negócio."
          plan={uniquePricingPlan}
        />
        <FinalCTA
          title="Sua loja merece estar online."
          description="Crie seu espaço digital e compartilhe seus produtos com quem já acompanha sua marca."
          href="/cadastro"
          label="Criar minha loja"
        />
      </main>
      <Footer brandName={brandName} />
    </div>
  );
}
