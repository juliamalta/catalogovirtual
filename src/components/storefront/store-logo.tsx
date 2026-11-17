import type { StoreDemo } from "@/types/store.types";

export function StoreLogo({
  store,
  className,
}: {
  store: StoreDemo;
  className: string;
}) {
  return (
    <span
      className={className}
      role={store.logoUrl ? "img" : undefined}
      aria-label={store.logoUrl ? store.name : undefined}
      style={
        store.logoUrl
          ? {
              backgroundImage: `url("${store.logoUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {store.logoUrl ? "" : store.logo}
    </span>
  );
}
