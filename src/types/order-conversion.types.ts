import type { WhatsAppOrderManualStatus, WhatsAppOrderStatus } from "@/lib/db/schema/whatsapp-orders.schema";

export interface ForwardingItemRequest {
  productId: string;
  quantity: number;
  /** IDs only; the server resolves names and prices from this store's catalog. */
  selectedOptionIds: string[];
}

export interface CreateWhatsAppForwardingRequest {
  /** Keep stable for retries of the same cart snapshot. */
  idempotencyKey: string;
  /** Keep stable only while retrying the same CTA click. */
  clickKey: string;
  items: ForwardingItemRequest[];
}

export interface ForwardingItemDTO {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  selectedOptions: Array<{ groupName: string; optionName: string }>;
}

export interface ForwardedOrderDTO {
  id: string;
  createdAt: string;
  status: WhatsAppOrderStatus;
  potentialValueCents: number;
  currency: "BRL";
  statusUpdatedAt: string | null;
  statusUpdatedByName: string | null;
  items: ForwardingItemDTO[];
}

export interface OrderConversionMetricsDTO {
  whatsappClicks: number;
  forwardedOrders: number;
  potentialValueCents: number;
  /** Null until at least one opportunity was explicitly confirmed by a seller. */
  confirmedSales: { count: number; valueCents: number } | null;
}

export interface ForwardingPeriodFilter {
  from?: string;
  to?: string;
  status?: WhatsAppOrderManualStatus;
}

export interface UpdateForwardingStatusRequest {
  status: WhatsAppOrderManualStatus;
}
