import { describe, expect, it } from "vitest";
import { businessHoursConfigurationSchema, createDefaultBusinessHours } from "./business-hours";

describe("business hours validation", () => {
  it("accepts a complete weekly schedule with multiple periods and overnight closing", () => {
    const value = createDefaultBusinessHours("America/Sao_Paulo");
    value.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "11:00", closesAt: "14:00" }, { opensAt: "18:00", closesAt: "02:00" }] };
    expect(businessHoursConfigurationSchema.safeParse(value).success).toBe(true);
  });

  it("rejects duplicate days, invalid time values, and same-day overlaps", () => {
    const value = createDefaultBusinessHours();
    value.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "09:00", closesAt: "14:00" }, { opensAt: "13:00", closesAt: "17:00" }] };
    expect(businessHoursConfigurationSchema.safeParse(value).success).toBe(false);
    const invalidTime = createDefaultBusinessHours();
    invalidTime.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "25:00", closesAt: "27:00" }] };
    expect(businessHoursConfigurationSchema.safeParse(invalidTime).success).toBe(false);
  });

  it("rejects overlap between an overnight period and the next day's schedule", () => {
    const value = createDefaultBusinessHours();
    value.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "18:00", closesAt: "02:00" }] };
    value.days[2] = { dayOfWeek: 2, isOpen: true, periods: [{ opensAt: "01:00", closesAt: "05:00" }] };
    expect(businessHoursConfigurationSchema.safeParse(value).success).toBe(false);
  });

  it("rejects invalid timezones and open days without periods", () => {
    const invalidZone = { ...createDefaultBusinessHours(), timeZone: "Moon/Base" };
    expect(businessHoursConfigurationSchema.safeParse(invalidZone).success).toBe(false);
    const noPeriod = createDefaultBusinessHours();
    noPeriod.days[0] = { dayOfWeek: 0, isOpen: true, periods: [] };
    expect(businessHoursConfigurationSchema.safeParse(noPeriod).success).toBe(false);
  });
});
