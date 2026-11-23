import { buildWhatsAppUrl } from "@/lib/utils";
import { parseBusinessHoursConfiguration } from "@/lib/validations/business-hours";

export interface DashboardSetupData {
  activeProductCount: number;
  logoUrl: string | null;
  coverUrl: string | null;
  whatsappNumber: string;
  openingHours: unknown;
}

/** Guidance only: these checks do not add requirements to publication. */
export function getDashboardSetup(data: DashboardSetupData) {
  let whatsappReady = false;
  try { buildWhatsAppUrl(data.whatsappNumber, ""); whatsappReady = true; } catch { /* The existing WhatsApp validator supplies the criterion. */ }
  return {
    products: data.activeProductCount > 0,
    appearance: Boolean(data.logoUrl || data.coverUrl),
    whatsapp: whatsappReady,
    hours: Boolean(parseBusinessHoursConfiguration(data.openingHours)),
  };
}
