export interface DashboardProductFilters { q?: string; category?: string; availability?: string }
interface FilterableProduct { name: string; categoryId: string | null; isActive: boolean }
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");

export function filterDashboardProducts<T extends FilterableProduct>(products: T[], filters: DashboardProductFilters): T[] {
  const query = searchable(filters.q ?? "");
  return products.filter((product) => (!query || searchable(product.name).includes(query)) &&
    (!filters.category || (filters.category === "none" ? !product.categoryId : product.categoryId === filters.category)) &&
    (filters.availability === "active" ? product.isActive : filters.availability === "inactive" ? !product.isActive : true));
}
