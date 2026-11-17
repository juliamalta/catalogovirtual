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
    description: "Organize seus produtos para as pessoas encontrarem o que procuram.",
    href: "/demonstracoes/casa-aurora",
    image: demoStores["casa-aurora"].cover,
    label: "Moda",
  },
  {
    title: "Vitrine Online",
    description: "Mostre suas coleções com o estilo da sua marca.",
    href: "/demonstracoes/casa-viva",
    image: demoStores["casa-viva"].cover,
    label: "Casa",
  },
];

export const landingSteps: LandingStep[] = [
  {
    number: "01",
    title: "Crie sua loja",
    description: "Escolha o nome e o formato que combinam com o seu negócio.",
  },
  {
    number: "02",
    title: "Apresente seus produtos",
    description: "Organize fotos, descrições e categorias em um só lugar.",
  },
  {
    number: "03",
    title: "Compartilhe seu link",
    description: "Envie sua loja para clientes nas redes ou por mensagem.",
  },
  {
    number: "04",
    title: "Combine o pedido",
    description: "A conversa e a confirmação acontecem direto no WhatsApp.",
  },
];

export const landingFeatures: LandingFeature[] = [
  {
    icon: "store",
    title: "Uma loja com seu link",
    description: "Compartilhe sua página onde seus clientes já estão.",
  },
  {
    icon: "message",
    title: "Conversa direta",
    description: "O pedido segue para o WhatsApp cadastrado pela loja.",
  },
  {
    icon: "sparkles",
    title: "Boa leitura em cada tela",
    description: "A loja se adapta ao celular e ao computador.",
  },
  {
    icon: "check",
    title: "Do seu jeito",
    description: "Escolha produtos, categorias e formato de apresentação.",
  },
];
