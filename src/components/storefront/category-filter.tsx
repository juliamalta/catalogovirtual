import type { CategoryFilterProps } from "./storefront-component.types";

export function CategoryFilter({
  categories,
  catalogTypography,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="store-categories">
      {categories.map((category, index) => (
        <button
          key={category.id}
          className={`${selectedCategory === category.id ? "active" : ""} ${catalogTypography ? "!text-[11px] md:!text-xs" : ""}`}
          onClick={() => onSelectCategory(category.id)}
        >
          {index === 0 && <span className="category-flower">✳</span>}
          {category.name}
        </button>
      ))}
    </div>
  );
}
