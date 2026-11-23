import { expect, it } from "vitest";
import { isProductAvailableToday } from "./product-availability";

it("uses the product editor Monday=1/Sunday=7 convention", () => {
  expect(isProductAvailableToday({ availabilityMode: "WEEKDAYS", availableDays: [7] }, new Date("2026-11-22T15:00:00Z"))).toBe(true);
  expect(isProductAvailableToday({ availabilityMode: "WEEKDAYS", availableDays: [1] }, new Date("2026-11-22T15:00:00Z"))).toBe(false);
});
it("evaluates availability in the store timezone rather than UTC or the visitor timezone", () => {
  const midnight = new Date("2026-11-19T01:00:00Z");
  const configuration = { availabilityMode: "WEEKDAYS" as const, availableDays: [3] };
  expect(isProductAvailableToday(configuration, midnight, "America/Sao_Paulo")).toBe(true);
  expect(isProductAvailableToday(configuration, midnight, "Asia/Tokyo")).toBe(false);
});
it("preserves always-available legacy products and rejects empty weekday schedules", () => {
  expect(isProductAvailableToday(undefined)).toBe(true);
  expect(isProductAvailableToday({ availabilityMode: "ALWAYS", availableDays: [] })).toBe(true);
  expect(isProductAvailableToday({ availabilityMode: "WEEKDAYS", availableDays: [] })).toBe(false);
});
