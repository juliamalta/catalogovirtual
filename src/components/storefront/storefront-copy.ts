import type { StoreDemo, StorefrontType } from "@/types/store.types";

export interface StorefrontCopy {
  heroTitle: string;
  heroSubtitle: string | null;
  heroEyebrow: string | null;
  heroStatus: string | null;
  heroAction: string;
  productEyebrow: string | null;
  productTitle: string;
  profileStatus: string | null;
  aboutEyebrow: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  aboutSignature: string | null;
  footerSignature: string | null;
}

const modelCopy: Record<StorefrontType, Pick<StorefrontCopy, "heroEyebrow" | "heroAction" | "productEyebrow" | "productTitle">> = {
  MENU: {
    heroEyebrow: "CARDÁPIO DIGITAL",
    heroAction: "Ver cardápio",
    productEyebrow: "CARDÁPIO DIGITAL",
    productTitle: "Nosso cardápio",
  },
  CATALOG: {
    heroEyebrow: "CATÁLOGO ONLINE",
    heroAction: "Ver produtos",
    productEyebrow: "CATÁLOGO ONLINE",
    productTitle: "Nossos produtos",
  },
  SHOWCASE: {
    heroEyebrow: "VITRINE ONLINE",
    heroAction: "Explorar vitrine",
    productEyebrow: "VITRINE ONLINE",
    productTitle: "Explore nossa coleção",
  },
};

const demoCopy: Record<StorefrontType, Pick<StorefrontCopy, "heroEyebrow" | "heroStatus" | "heroAction" | "productEyebrow" | "productTitle" | "profileStatus" | "aboutEyebrow" | "aboutTitle" | "aboutSignature" | "footerSignature">> = {
  MENU: {
    heroEyebrow: null,
    heroStatus: "Loja aberta hoje · 9h–18h",
    heroAction: "Conheça nossos produtos",
    productEyebrow: "FEITO COM CARINHO, ESCOLHIDO POR VOCÊ",
    productTitle: "Um docinho muda o dia",
    profileStatus: "Disponível",
    aboutEyebrow: "UM POUCO SOBRE NÓS",
    aboutTitle: "Pequenos detalhes. Grandes momentos.",
    aboutSignature: "Com carinho",
    footerSignature: "feito com carinho",
  },
  CATALOG: {
    heroEyebrow: null,
    heroStatus: "Loja aberta hoje · 9h–18h",
    heroAction: "Conheça nossos produtos",
    productEyebrow: "FEITO COM CARINHO, ESCOLHIDO POR VOCÊ",
    productTitle: "Encontre seu próximo favorito",
    profileStatus: "Disponível",
    aboutEyebrow: "UM POUCO SOBRE NÓS",
    aboutTitle: "Pequenos detalhes. Grandes momentos.",
    aboutSignature: "Com carinho",
    footerSignature: "feito com carinho",
  },
  SHOWCASE: {
    heroEyebrow: "OBJETOS PARA VIVER BEM",
    heroStatus: null,
    heroAction: "Descobrir coleção",
    productEyebrow: "FEITO COM CARINHO, ESCOLHIDO POR VOCÊ",
    productTitle: "Peças que contam histórias",
    profileStatus: "Disponível",
    aboutEyebrow: "UM POUCO SOBRE NÓS",
    aboutTitle: "Pequenos detalhes. Grandes momentos.",
    aboutSignature: "Com carinho",
    footerSignature: "feito com carinho",
  },
};

export function resolveStorefrontCopy(store: StoreDemo, isDemo = false): StorefrontCopy {
  const description = store.description.trim();
  const configuredTitle = store.tagline.trim();
  const configuredSubtitle = store.subtitle?.trim();

  if (isDemo) {
    const copy = demoCopy[store.type];
    return {
      ...copy,
      heroTitle: configuredTitle || store.name.trim(),
      heroSubtitle: configuredSubtitle || description || null,
      aboutDescription: description
        ? `${description} Cada escolha é feita pensando em deixar um pedacinho do nosso mundo na sua casa.`
        : null,
      aboutSignature: copy.aboutSignature ? `${copy.aboutSignature}, ${store.name}` : null,
    };
  }

  const model = modelCopy[store.type];
  return {
    ...model,
    heroTitle: configuredTitle || store.name.trim(),
    heroSubtitle: configuredSubtitle || description || null,
    heroStatus: null,
    profileStatus: null,
    aboutEyebrow: "SOBRE A LOJA",
    aboutTitle: store.name.trim(),
    aboutDescription: description || null,
    aboutSignature: null,
    footerSignature: null,
  };
}

export interface ProductEmptyState {
  message: string;
  showClearFilters: boolean;
}

export function resolveProductEmptyState(productCount: number, hasActiveFilters: boolean): ProductEmptyState {
  if (productCount === 0) {
    return {
      message: "Nenhum produto disponível no momento.",
      showClearFilters: hasActiveFilters,
    };
  }

  return {
    message: "Nenhum produto encontrado para sua busca.",
    showClearFilters: hasActiveFilters,
  };
}
