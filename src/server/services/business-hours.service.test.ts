import { describe, expect, it } from "vitest";
import { createDefaultBusinessHours } from "@/lib/validations/business-hours";
import { calculateStoreOperatingStatus } from "./business-hours.service";

function schedule(overrides: Record<number, { opensAt: string; closesAt: string }[]> = {}, timeZone = "UTC") {
  const configuration = createDefaultBusinessHours(timeZone);
  return {
    ...configuration,
    days: configuration.days.map((day) => ({
      ...day,
      isOpen: Boolean(overrides[day.dayOfWeek]?.length),
      periods: overrides[day.dayOfWeek] ?? [],
    })),
  };
}

describe("store operating hours", () => {
  it("reports open during a configured period and gives the closing time", () => {
    const value = schedule({ 1: [{ opensAt: "09:00", closesAt: "22:00" }] });
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-02T12:00:00.000Z"))).toEqual({
      state: "OPEN",
      label: "Aberto agora",
      detail: "Fecha às 22:00",
    });
  });

  it("reports closed outside hours and when the next period begins", () => {
    const value = schedule({ 1: [{ opensAt: "09:00", closesAt: "12:00" }, { opensAt: "13:00", closesAt: "18:00" }] });
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-02T12:30:00.000Z"))).toEqual({
      state: "CLOSED",
      label: "Fechado agora",
      detail: "Abre hoje às 13:00",
    });
  });

  it("uses the configured weekend days", () => {
    const value = schedule({
      0: [{ opensAt: "10:00", closesAt: "14:00" }],
      6: [{ opensAt: "10:00", closesAt: "14:00" }],
    });
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-07T11:00:00.000Z")).state).toBe("OPEN");
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-08T11:00:00.000Z")).state).toBe("OPEN");
  });

  it("handles a lunch break as two separate periods", () => {
    const value = schedule({ 1: [{ opensAt: "09:00", closesAt: "12:00" }, { opensAt: "13:00", closesAt: "18:00" }] });
    const status = calculateStoreOperatingStatus(value, new Date("2025-06-02T12:30:00.000Z"));
    expect(status.state).toBe("CLOSED");
    expect(status.detail).toBe("Abre hoje às 13:00");
  });

  it("keeps an overnight opening active after midnight", () => {
    const value = schedule({ 1: [{ opensAt: "18:00", closesAt: "02:00" }] });
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-03T01:00:00.000Z"))).toEqual({
      state: "OPEN",
      label: "Aberto agora",
      detail: "Fecha às 02:00",
    });
  });

  it("lets a temporary manual closure override scheduled hours and reopens in automatic mode", () => {
    const value = schedule({ 1: [{ opensAt: "09:00", closesAt: "18:00" }] });
    const now = new Date("2025-06-02T12:00:00.000Z");
    expect(calculateStoreOperatingStatus({ ...value, manualStatus: "TEMPORARILY_CLOSED" }, now).state).toBe("TEMPORARILY_CLOSED");
    expect(calculateStoreOperatingStatus({ ...value, manualStatus: "AUTO" }, now).state).toBe("OPEN");
  });

  it("calculates the local time using the store timezone", () => {
    const value = schedule({ 1: [{ opensAt: "09:00", closesAt: "10:00" }] }, "America/Sao_Paulo");
    expect(calculateStoreOperatingStatus(value, new Date("2025-06-02T12:30:00.000Z")).state).toBe("OPEN");
  });

  it("uses a neutral state when the schedule is missing or incomplete", () => {
    expect(calculateStoreOperatingStatus({}, new Date("2025-06-02T12:00:00.000Z"))).toEqual({
      state: "UNKNOWN",
      label: "Horário não informado",
      detail: null,
    });
    expect(calculateStoreOperatingStatus(schedule({ 1: [{ opensAt: "09:00", closesAt: "18:00" }] }).days, new Date()).state).toBe("UNKNOWN");
  });

  it("reports when the next opening is tomorrow", () => {
    const value = schedule({ 2: [{ opensAt: "11:00", closesAt: "20:00" }] });
    const status = calculateStoreOperatingStatus(value, new Date("2025-06-02T22:00:00.000Z"));
    expect(status.state).toBe("CLOSED");
    expect(status.detail).toBe("Abre amanhã às 11:00");
  });
});
