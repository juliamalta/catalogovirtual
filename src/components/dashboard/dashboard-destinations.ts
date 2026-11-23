import { Package, Palette, Settings2, Tags, type LucideIcon } from "lucide-react";
import { hasStorePermission, type StoreMembershipRef, type StorePermission } from "@/features/stores/permissions";

const destinations = [
  { path: "produtos", label: "Produtos", description: "Edite itens, preços e disponibilidade", icon: Package, permission: "MANAGE_PRODUCTS" },
  { path: "categorias", label: "Categorias", description: "Organize os produtos do catálogo", icon: Tags, permission: "MANAGE_CATEGORIES" },
  { path: "aparencia", label: "Aparência", description: "Personalize a identidade da sua loja", icon: Palette, permission: "MANAGE_SETTINGS" },
  { path: "configuracoes", label: "Configurações", description: "Ajuste horários, entregas e WhatsApp", icon: Settings2, permission: "MANAGE_SETTINGS" }
] satisfies { path: string; label: string; description: string; icon: LucideIcon; permission: StorePermission }[];

export function getDashboardDestinations(storeSlug: string, membership: StoreMembershipRef) {
  return destinations
    .filter(({ permission }) => hasStorePermission(membership, membership.storeId, permission))
    .map((destination) => ({ ...destination, href: `/painel/${storeSlug}/${destination.path}` }));
}
