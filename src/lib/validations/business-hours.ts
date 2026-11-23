import { z } from "zod";
import type { BusinessHoursConfiguration } from "@/types/business-hours.types";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

const periodSchema = z.object({
  opensAt: z.string().regex(timePattern, "Informe o horário de abertura no formato HH:mm."),
  closesAt: z.string().regex(timePattern, "Informe o horário de encerramento no formato HH:mm."),
}).superRefine((period, context) => {
  if (period.opensAt === period.closesAt) {
    context.addIssue({ code: "custom", path: ["closesAt"], message: "A abertura e o encerramento não podem ser iguais." });
  }
});

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const businessHoursDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  periods: z.array(periodSchema).max(5, "É possível cadastrar até cinco períodos por dia."),
}).superRefine((day, context) => {
  if (day.isOpen && day.periods.length === 0) {
    context.addIssue({ code: "custom", path: ["periods"], message: "Adicione ao menos um período ou marque o dia como fechado." });
  }
});

export const businessHoursConfigurationSchema = z.object({
  version: z.literal(1),
  timeZone: z.string().trim().min(1).max(64).refine(isValidTimeZone, "Informe um fuso horário IANA válido."),
  manualStatus: z.enum(["AUTO", "TEMPORARILY_CLOSED"]),
  days: z.array(businessHoursDaySchema).length(7, "Configure os sete dias da semana."),
}).superRefine((configuration, context) => {
  const dayNumbers = new Set(configuration.days.map((day) => day.dayOfWeek));
  if (dayNumbers.size !== 7) {
    context.addIssue({ code: "custom", path: ["days"], message: "Cada dia da semana deve aparecer uma única vez." });
  }

  const daysByNumber = new Map(configuration.days.map((day) => [day.dayOfWeek, day]));
  for (let dayNumber = 0; dayNumber < 7; dayNumber += 1) {
    const currentDay = daysByNumber.get(dayNumber);
    const previousDay = daysByNumber.get((dayNumber + 6) % 7);
    if (!currentDay) continue;

    const intervals: Array<{ start: number; end: number }> = [];
    if (currentDay.isOpen) {
      for (const period of currentDay.periods) {
        const start = toMinutes(period.opensAt);
        const close = toMinutes(period.closesAt);
        const end = close <= start ? close + 24 * 60 : close;
        intervals.push({ start, end: Math.min(end, 24 * 60) });
      }
    }
    if (previousDay?.isOpen) {
      for (const period of previousDay.periods) {
        const start = toMinutes(period.opensAt);
        const close = toMinutes(period.closesAt);
        const end = close <= start ? close + 24 * 60 : close;
        if (end > 24 * 60) intervals.push({ start: 0, end: end - 24 * 60 });
      }
    }

    intervals.sort((left, right) => left.start - right.start);
    for (let index = 1; index < intervals.length; index += 1) {
      if (intervals[index].start < intervals[index - 1].end) {
        context.addIssue({ code: "custom", path: ["days"], message: "Os períodos de atendimento não podem se sobrepor, inclusive entre dias consecutivos." });
        break;
      }
    }
  }
});

export function createDefaultBusinessHours(timeZone = "America/Sao_Paulo"): BusinessHoursConfiguration {
  return {
    version: 1,
    timeZone,
    manualStatus: "AUTO",
    days: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isOpen: false, periods: [] })),
  };
}

export function parseBusinessHoursConfiguration(value: unknown): BusinessHoursConfiguration | null {
  const result = businessHoursConfigurationSchema.safeParse(value);
  return result.success ? result.data : null;
}
