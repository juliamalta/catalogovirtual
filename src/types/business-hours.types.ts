export type ManualStoreStatus = "AUTO" | "TEMPORARILY_CLOSED";

export type StoreOperatingState = "OPEN" | "CLOSED" | "TEMPORARILY_CLOSED" | "UNKNOWN";

export interface BusinessHoursPeriod {
  opensAt: string;
  closesAt: string;
}

export interface BusinessHoursDay {
  dayOfWeek: number;
  isOpen: boolean;
  periods: BusinessHoursPeriod[];
}

export interface BusinessHoursConfiguration {
  version: 1;
  timeZone: string;
  manualStatus: ManualStoreStatus;
  days: BusinessHoursDay[];
}

export interface StoreOperatingStatus {
  state: StoreOperatingState;
  label: string;
  detail: string | null;
}

export type OrderAcceptancePolicy = "OPEN_ONLY" | "ALLOW_AFTER_HOURS";
