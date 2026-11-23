import { demoStores } from "@/features/stores/demo-data";
import type { LandingFeature, LandingStep, LandingStoreModel } from "./landing.types";

export const landingStoreModels: LandingStoreModel[] = [
  {
    title: "Cardápio Digital",
    description: "Apresente seus sabores e receba pedidos pelo WhatsApp.",
    href: "/demonstracoes/doce-encanto",
    image: demoStores["doce-encanto"].cover,
    label: "Doceria",
  },
  {
    title: "Catálogo Online",
    description: "Organize seus produtos para seus clientes encontrarem o que procuram.",
    href: "/demonstracoes/casa-aurora",
    image: demoStores["casa-aurora"].cover,
    label: "Moda",
  },
  {
    title: "Vitrine Online",
    description: "Apresente suas coleções com o estilo da sua marca.",
    href: "/demonstracoes/casa-viva",
    image: demoStores["casa-viva"].cover,
    label: "Casa",
  },
];

export const landingSteps: LandingStep[] = [
  { number: "01", title: "Crie sua loja", description: "Escolha o nome e o formato que combinam com o seu negócio." },
  { number: "02", title: "Apresente seus produtos", description: "Organize produtos, descrições e categorias em um só lugar." },
  { number: "03", title: "Compartilhe seu link", description: "Envie sua loja para clientes pelas redes ou por mensagem." },
  { number: "04", title: "Combine o pedido", description: "A conversa e a confirmação acontecem diretamente no WhatsApp." },
];

export const landingFeatures: LandingFeature[] = [
  { icon: "store", title: "Uma loja com seu link", description: "Compartilhe sua página nos canais em que seus clientes já estão." },
  { icon: "message", title: "Conversa direta", description: "O cliente segue para o WhatsApp cadastrado pela loja." },
  { icon: "sparkles", title: "Boa leitura em cada tela", description: "A loja se adapta ao celular e ao computador." },
  { icon: "check", title: "Do seu jeito", description: "Escolha produtos, categorias e formato de apresentação." },
];
