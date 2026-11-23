import { describe, expect, it } from "vitest";
import { createDefaultBusinessHours } from "@/lib/validations/business-hours";
import { businessHoursCopyDestinations, businessHoursOverwriteTargets, countConfiguredBusinessDays, getBusinessHoursEditorErrors, summarizeBusinessHoursDay } from "./business-hours-editor.utils";

describe("business hours editor presentation", () => {
  it("counts days with valid periods, including multiple and overnight periods", () => {
    const schedule = createDefaultBusinessHours();
    schedule.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "11:00", closesAt: "14:00" }, { opensAt: "18:00", closesAt: "22:00" }] };
    schedule.days[2] = { dayOfWeek: 2, isOpen: true, periods: [{ opensAt: "22:00", closesAt: "02:00" }] };
    schedule.days[4].isOpen = true;
    expect(countConfiguredBusinessDays(schedule)).toBe(2);
    expect(summarizeBusinessHoursDay(schedule.days[1])).toBe("11:00–14:00 · 18:00–22:00");
    expect(summarizeBusinessHoursDay(schedule.days[2])).toContain("(dia seguinte)");
  });
  it("does not count missing, invalid, overlapping or closed periods", () => {
    const schedule = createDefaultBusinessHours();
    schedule.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "11:00", closesAt: "14:00" }, { opensAt: "13:00", closesAt: "16:00" }] };
    schedule.days[2] = { dayOfWeek: 2, isOpen: false, periods: [{ opensAt: "10:00", closesAt: "12:00" }] };
    schedule.days[3] = { dayOfWeek: 3, isOpen: true, periods: [{ opensAt: "", closesAt: "14:00" }] };
    expect(countConfiguredBusinessDays(schedule)).toBe(0);
    const before = JSON.stringify(schedule.days[2]);
    expect(summarizeBusinessHoursDay(schedule.days[2])).toBe("Horários guardados: 10:00–12:00");
    expect(JSON.stringify(schedule.days[2])).toBe(before);
  });
  it("reuses the weekly validator to exclude conflicts across consecutive days", () => {
    const schedule = createDefaultBusinessHours();
    schedule.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "22:00", closesAt: "02:00" }] };
    schedule.days[2] = { dayOfWeek: 2, isOpen: true, periods: [{ opensAt: "01:00", closesAt: "04:00" }] };
    schedule.days[5] = { dayOfWeek: 5, isOpen: true, periods: [{ opensAt: "11:00", closesAt: "14:00" }] };
    expect(countConfiguredBusinessDays(schedule)).toBe(1);
    const errors = getBusinessHoursEditorErrors(schedule);
    expect(errors.general[0]).toContain("sobrepor");
    expect(errors.days[1].summary).toContain("sobrepor");
    expect(errors.days[2].summary).toContain("sobrepor");
  });
  it("exposes field, missing-period and timezone errors with the existing messages", () => {
    const schedule = createDefaultBusinessHours();
    schedule.timeZone = "Moon/Base";
    schedule.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "", closesAt: "14:00" }] };
    schedule.days[2].isOpen = true;
    const errors = getBusinessHoursEditorErrors(schedule);
    expect(errors.days[1].fields["0.opensAt"]).toContain("abertura");
    expect(errors.days[2].summary).toContain("Adicione ao menos um período");
    expect(errors.timeZone).toContain("fuso horário");
  });
  it("filters the source out of destinations and detects actual overwrites without mutating data", () => {
    const schedule = createDefaultBusinessHours();
    schedule.days[1] = { dayOfWeek: 1, isOpen: true, periods: [{ opensAt: "11:00", closesAt: "14:00" }] };
    schedule.days[2] = { dayOfWeek: 2, isOpen: false, periods: [{ opensAt: "18:00", closesAt: "22:00" }] };
    const before = JSON.stringify(schedule);
    expect(businessHoursCopyDestinations(schedule, 1, [1, 2, 3]).map((day) => day.dayOfWeek)).toEqual([2, 3]);
    expect(businessHoursOverwriteTargets(schedule, 1, [1, 2, 3]).map((day) => day.dayOfWeek)).toEqual([2]);
    expect(businessHoursOverwriteTargets(schedule, 1, [])).toEqual([]);
    expect(JSON.stringify(schedule)).toBe(before);
  });
});
