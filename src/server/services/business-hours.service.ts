import { businessHoursConfigurationSchema } from "@/lib/validations/business-hours";
import type { BusinessHoursConfiguration, StoreOperatingStatus } from "@/types/business-hours.types";

const weekdayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour) % 24,
    minute: Number(values.minute),
  };
}

function minutesAt(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function nextCalendarDay(parts: ZonedDateTimeParts, offset: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatStatus(state: StoreOperatingStatus["state"], detail: string | null = null): StoreOperatingStatus {
  const labels: Record<StoreOperatingStatus["state"], string> = {
    OPEN: "Aberto agora",
    CLOSED: "Fechado agora",
    TEMPORARILY_CLOSED: "Fechado temporariamente",
    UNKNOWN: "Horário não informado",
  };
  return { state, label: labels[state], detail };
}

function findOpenPeriod(configuration: BusinessHoursConfiguration, dayOfWeek: number, currentMinute: number) {
  const day = configuration.days.find((item) => item.dayOfWeek === dayOfWeek);
  if (!day?.isOpen) return undefined;

  return day.periods.find((period) => {
    const start = minutesAt(period.opensAt);
    const close = minutesAt(period.closesAt);
    if (close > start) return currentMinute >= start && currentMinute < close;
    return currentMinute >= start;
  });
}

function isOpenFromPreviousDay(configuration: BusinessHoursConfiguration, dayOfWeek: number, currentMinute: number) {
  const previousDay = configuration.days.find((item) => item.dayOfWeek === (dayOfWeek + 6) % 7);
  if (!previousDay?.isOpen) return undefined;

  return previousDay.periods.find((period) => {
    const start = minutesAt(period.opensAt);
    const close = minutesAt(period.closesAt);
    return close <= start && currentMinute < close;
  });
}

function findNextOpening(configuration: BusinessHoursConfiguration, dayOfWeek: number, currentMinute: number) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDay = (dayOfWeek + offset) % 7;
    const day = configuration.days.find((item) => item.dayOfWeek === candidateDay);
    if (!day?.isOpen) continue;
    const nextPeriod = day.periods
      .filter((period) => offset > 0 || minutesAt(period.opensAt) > currentMinute)
      .sort((left, right) => minutesAt(left.opensAt) - minutesAt(right.opensAt))[0];
    if (nextPeriod) return { offset, dayOfWeek: candidateDay, time: nextPeriod.opensAt };
  }
  return null;
}

export function calculateStoreOperatingStatus(value: unknown, now = new Date()): StoreOperatingStatus {
  if (value && typeof value === "object" && "manualStatus" in value && value.manualStatus === "TEMPORARILY_CLOSED") {
    return formatStatus("TEMPORARILY_CLOSED");
  }

  const result = businessHoursConfigurationSchema.safeParse(value);
  if (!result.success) return formatStatus("UNKNOWN");
  const configuration = result.data;
  const local = getZonedParts(now, configuration.timeZone);
  const dayOfWeek = getDayOfWeek(local.year, local.month, local.day);
  const currentMinute = local.hour * 60 + local.minute;

  const currentPeriod = findOpenPeriod(configuration, dayOfWeek, currentMinute)
    ?? isOpenFromPreviousDay(configuration, dayOfWeek, currentMinute);
  if (currentPeriod) return formatStatus("OPEN", `Fecha às ${currentPeriod.closesAt}`);

  const nextOpening = findNextOpening(configuration, dayOfWeek, currentMinute);
  if (!nextOpening) return formatStatus("CLOSED", "Fechado hoje");
  const openingLabel = nextOpening.offset === 0
    ? "Abre hoje"
    : nextOpening.offset === 1
      ? "Abre amanhã"
      : `Abre ${weekdayNames[nextOpening.dayOfWeek]}`;
  return formatStatus("CLOSED", `${openingLabel} às ${nextOpening.time}`);
}
