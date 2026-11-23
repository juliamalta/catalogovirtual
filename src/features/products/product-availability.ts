import type { ProductConfigurationDTO } from "@/types/product-configuration.types";

/** Product editor uses Monday=1 through Sunday=7, unlike the hours editor (Sunday=0). */
export function isProductAvailableToday(configuration: Pick<ProductConfigurationDTO, "availabilityMode" | "availableDays"> | undefined, now = new Date(), timeZone = "America/Sao_Paulo") {
  if (!configuration || configuration.availabilityMode === "ALWAYS") return true;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday) + 1;
  return configuration.availableDays.includes(day);
}
