import { Search } from "lucide-react";
import type { ProductSearchProps } from "./storefront-component.types";

export function ProductSearch({ catalogTypography, query, onQueryChange }: ProductSearchProps) {
  const catalogClasses = catalogTypography ? "!text-xs md:!text-[13px]" : "";
  const keyboardClass = catalogTypography ? "!text-[9px]" : "";
  return (
    <label className="store-search">
      <Search size={15} />
      <input
        aria-label="Buscar produtos"
        placeholder="Buscar produto"
        value={query}
        className={catalogClasses}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <kbd className={keyboardClass}>⌘ K</kbd>
    </label>
  );
}
