import { describe, expect, it } from "vitest";
import { getDashboardSetup } from "./dashboard-setup";
import { createDefaultBusinessHours } from "@/lib/validations/business-hours";

const empty = { activeProductCount: 0, logoUrl: null, coverUrl: null, whatsappNumber: "", openingHours: null };
describe("dashboard setup guidance", () => {
  it("does not invent completed steps for empty or invalid saved data", () => {
    expect(getDashboardSetup(empty)).toEqual({ products: false, appearance: false, whatsapp: false, hours: false });
    expect(getDashboardSetup({ ...empty, openingHours: { days: [] } }).hours).toBe(false);
  });
  it("derives each step from real saved values independently", () => {
    expect(getDashboardSetup({ ...empty, activeProductCount: 1, coverUrl: "/cover.jpg",
      whatsappNumber: "+55 (11) 99999-9999", openingHours: createDefaultBusinessHours() }))
      .toEqual({ products: true, appearance: true, whatsapp: true, hours: true });
  });
  it("does not count an absent schedule as configured or require a logo if a cover exists", () => {
    const result = getDashboardSetup({ ...empty, coverUrl: "/cover.jpg", whatsappNumber: "123" });
    expect(result).toMatchObject({ appearance: true, whatsapp: false, hours: false });
  });
});
