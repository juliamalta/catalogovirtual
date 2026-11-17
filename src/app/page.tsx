import "@/components/marketing/landing.css";
import { Features } from "@/components/marketing/features";
import { FinalCTA } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { StoreModels } from "@/components/marketing/store-models";
import { landingFeatures, landingSteps, landingStoreModels } from "@/features/marketing/landing-content";
import { demoStores } from "@/features/stores/demo-data";

const brandName = "Catálogo Loja Virtual";

export default function HomePage() {
  return (
    <div className="landing">
      <Header brandName={brandName} loginHref="/login" signupHref="/cadastro" />
      <main>
        <Hero
          title={<>Sua loja online,<br /> pronta para vender.</>}
          description="Crie seu cardápio, catálogo ou vitrine digital, compartilhe seu link e receba pedidos diretamente pelo WhatsApp."
          primaryHref="/cadastro"
          secondaryHref="/demonstracoes/doce-encanto"
          sampleStore={demoStores["doce-encanto"]}
        />
        <StoreModels
          title={<>Um formato para cada negócio.</>}
          description="Conheça lojas demonstrativas e veja como cada formato apresenta produtos de um jeito próprio."
          models={landingStoreModels}
        />
        <HowItWorks
          title={<>Do cadastro ao primeiro pedido.</>}
          description="Configure sua loja, organize seus produtos e compartilhe o link com seus clientes."
          actionHref="/cadastro"
          steps={landingSteps}
        />
        <ProductShowcase store={demoStores["casa-aurora"]} href="/demonstracoes/casa-aurora" />
        <Features
          title={<>Tudo o que sua loja precisa para começar.</>}
          description="Uma presença digital clara, simples de compartilhar e conectada ao atendimento da sua loja."
          features={landingFeatures}
        />
        <FinalCTA
          title={<>Sua loja merece estar online.</>}
          description="Monte seu espaço digital e compartilhe seus produtos com seus clientes."
          href="/cadastro"
          label="Criar minha loja"
        />
      </main>
      <Footer brandName={brandName} />
    </div>
  );
}
