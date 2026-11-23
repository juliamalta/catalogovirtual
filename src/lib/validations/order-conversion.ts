import { z } from "zod";
import { whatsappOrderStatusValues } from "@/lib/db/schema/whatsapp-orders.schema";

const uuidSchema = z.string().uuid();

export const forwardingItemRequestSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1).max(99),
  selectedOptionIds: z.array(uuidSchema).max(50).default([])
}).superRefine((item, context) => {
  if (new Set(item.selectedOptionIds).size !== item.selectedOptionIds.length) {
    context.addIssue({ code: "custom", path: ["selectedOptionIds"], message: "A seleção contém opções repetidas." });
  }
});

/** No buyer fields or client supplied names/prices are accepted here. */
export const createWhatsAppForwardingSchema = z.object({
  idempotencyKey: uuidSchema,
  clickKey: uuidSchema,
  items: z.array(forwardingItemRequestSchema).min(1).max(50)
});

export const updateForwardingStatusSchema = z.object({
  status: z.enum(whatsappOrderStatusValues)
});

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Informe uma data válida.");

export const forwardingPeriodFilterSchema = z.object({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  status: z.enum(whatsappOrderStatusValues).optional()
}).superRefine((filter, context) => {
  if (filter.from && filter.to && filter.from > filter.to) {
    context.addIssue({ code: "custom", path: ["to"], message: "A data final deve ser igual ou posterior à inicial." });
  }
});

export type CreateWhatsAppForwardingInput = z.infer<typeof createWhatsAppForwardingSchema>;
export type UpdateForwardingStatusInput = z.infer<typeof updateForwardingStatusSchema>;
export type ForwardingPeriodFilterInput = z.infer<typeof forwardingPeriodFilterSchema>;
