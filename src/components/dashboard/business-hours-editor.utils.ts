import { businessHoursConfigurationSchema, createDefaultBusinessHours } from "@/lib/validations/business-hours";
import type { BusinessHoursConfiguration, BusinessHoursDay } from "@/types/business-hours.types";

export const businessWeekDays = [
  { day: 1, label: "Segunda-feira" }, { day: 2, label: "Terça-feira" },
  { day: 3, label: "Quarta-feira" }, { day: 4, label: "Quinta-feira" },
  { day: 5, label: "Sexta-feira" }, { day: 6, label: "Sábado" }, { day: 0, label: "Domingo" },
] as const;

/** Display-only validation of one day; saving still validates the complete saved timezone and week. */
export function validateBusinessHoursDay(day: BusinessHoursDay) {
  const isolatedWeek = createDefaultBusinessHours();
  isolatedWeek.days = isolatedWeek.days.map((item) => item.dayOfWeek === day.dayOfWeek ? day : item);
  return businessHoursConfigurationSchema.safeParse(isolatedWeek);
}

export function countConfiguredBusinessDays(schedule: BusinessHoursConfiguration) {
  const valid = schedule.days.filter((day) => day.isOpen && day.periods.length > 0 && validateBusinessHoursDay(day).success);
  return valid.filter((day) => {
    const adjacent = new Set([day.dayOfWeek, (day.dayOfWeek + 6) % 7, (day.dayOfWeek + 1) % 7]);
    const context = createDefaultBusinessHours();
    context.days = context.days.map((empty) => valid.find((item) => item.dayOfWeek === empty.dayOfWeek && adjacent.has(item.dayOfWeek)) ?? empty);
    return businessHoursConfigurationSchema.safeParse(context).success;
  }).length;
}

export function summarizeBusinessHoursDay(day: BusinessHoursDay) {
  if (!day.periods.length) return day.isOpen ? "Adicione um período de atendimento." : "Nenhum horário de atendimento.";
  if (!validateBusinessHoursDay(day).success) return "Confira os horários cadastrados.";
  const periods = day.periods.map((period) => `${period.opensAt}–${period.closesAt}${period.closesAt < period.opensAt ? " (dia seguinte)" : ""}`).join(" · ");
  return day.isOpen ? periods : `Horários guardados: ${periods}`;
}

export interface BusinessHoursDayErrors { summary?: string; fields: Record<string, string> }
export function getBusinessHoursEditorErrors(schedule: BusinessHoursConfiguration) {
  const parsed = businessHoursConfigurationSchema.safeParse(schedule);
  const days: Record<number, BusinessHoursDayErrors> = {};
  const general: string[] = [];
  let timeZone: string | undefined;
  if (parsed.success) return { days, general, timeZone };
  for (const issue of parsed.error.issues) {
    if (issue.path[0] === "timeZone") timeZone = issue.message;
    else if (issue.path[0] !== "days" || typeof issue.path[1] !== "number") general.push(issue.message);
  }
  for (const day of schedule.days) {
    const local = validateBusinessHoursDay(day);
    const errors: BusinessHoursDayErrors = { fields: {} };
    if (!local.success) for (const issue of local.error.issues) {
      if (issue.path[2] === "periods" && typeof issue.path[3] === "number" && typeof issue.path[4] === "string") {
        errors.fields[`${issue.path[3]}.${issue.path[4]}`] = issue.message;
      } else errors.summary ??= issue.message;
    }
    // The existing schema reports week/overnight overlaps at the week level.
    // Surface that exact message on open days as well, so collapsed cards cannot hide it.
    if (general.length && day.isOpen) errors.summary ??= general[0];
    if (errors.summary || Object.keys(errors.fields).length) days[day.dayOfWeek] = errors;
  }
  return { days, general: [...new Set(general)], timeZone };
}

export function businessHoursCopyDestinations(schedule: BusinessHoursConfiguration, source: number, targets: number[]) {
  return schedule.days.filter((day) => day.dayOfWeek !== source && targets.includes(day.dayOfWeek));
}

export function businessHoursOverwriteTargets(schedule: BusinessHoursConfiguration, source: number, targets: number[]) {
  const original = schedule.days.find((day) => day.dayOfWeek === source);
  if (!original) return [];
  return businessHoursCopyDestinations(schedule, source, targets).filter((day) =>
    (day.isOpen || day.periods.length > 0) &&
    (day.isOpen !== original.isOpen || JSON.stringify(day.periods) !== JSON.stringify(original.periods)));
}
