import { sql } from "drizzle-orm";
import { bigint, check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { stores } from "./store.schema";

export const whatsappOrderStatusEnum = pgEnum("whatsapp_order_status", [
  "CLICK_RECORDED",
  "FORWARDED_TO_WHATSAPP",
  "IN_NEGOTIATION",
  "CONFIRMED",
  "NOT_CONVERTED"
]);

export interface OrderOptionSnapshot {
  groupName: string;
  optionName: string;
}

export const whatsappOrderForwardings = pgTable("whatsapp_order_forwardings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  idempotencyKey: uuid("idempotency_key").notNull(),
  status: whatsappOrderStatusEnum("status").notNull().default("CLICK_RECORDED"),
  potentialValueCents: bigint("potential_value_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("BRL"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
  statusUpdatedBy: text("status_updated_by").references(() => users.id, { onDelete: "set null" })
}, (table) => [
  unique("whatsapp_order_forwardings_store_id_id_unique").on(table.storeId, table.id),
  unique("whatsapp_order_forwardings_idempotency_unique").on(table.storeId, table.idempotencyKey),
  index("whatsapp_order_forwardings_store_created_idx").on(table.storeId, table.createdAt),
  index("whatsapp_order_forwardings_store_status_created_idx").on(table.storeId, table.status, table.createdAt),
  check("whatsapp_order_forwardings_potential_nonnegative_check", sql`${table.potentialValueCents} >= 0`),
  check("whatsapp_order_forwardings_manual_status_check", sql`(${table.status} = 'CLICK_RECORDED' AND ${table.statusUpdatedAt} IS NULL) OR (${table.status} <> 'CLICK_RECORDED' AND ${table.statusUpdatedAt} IS NOT NULL)`)
]);

export const whatsappOrderClicks = pgTable("whatsapp_order_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  forwardingId: uuid("forwarding_id").notNull(),
  clickKey: uuid("click_key").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("whatsapp_order_clicks_forwarding_click_unique").on(table.storeId, table.forwardingId, table.clickKey),
  index("whatsapp_order_clicks_store_attempted_idx").on(table.storeId, table.attemptedAt),
  foreignKey({ name: "whatsapp_order_clicks_forwarding_fk", columns: [table.storeId, table.forwardingId], foreignColumns: [whatsappOrderForwardings.storeId, whatsappOrderForwardings.id] }).onDelete("cascade")
]);

export const whatsappOrderItems = pgTable("whatsapp_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  forwardingId: uuid("forwarding_id").notNull(),
  productIdSnapshot: uuid("product_id_snapshot").notNull(),
  productNameSnapshot: varchar("product_name_snapshot", { length: 140 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  lineTotalCents: bigint("line_total_cents", { mode: "number" }).notNull(),
  selectedOptionsSnapshot: jsonb("selected_options_snapshot").$type<OrderOptionSnapshot[]>().notNull().default([])
}, (table) => [
  index("whatsapp_order_items_store_forwarding_idx").on(table.storeId, table.forwardingId),
  foreignKey({ name: "whatsapp_order_items_forwarding_fk", columns: [table.storeId, table.forwardingId], foreignColumns: [whatsappOrderForwardings.storeId, whatsappOrderForwardings.id] }).onDelete("cascade"),
  check("whatsapp_order_items_quantity_check", sql`${table.quantity} BETWEEN 1 AND 99`),
  check("whatsapp_order_items_prices_check", sql`${table.unitPriceCents} >= 0 AND ${table.lineTotalCents} >= 0 AND ${table.lineTotalCents} = ${table.unitPriceCents} * ${table.quantity}`)
]);

export const whatsappOrderStatusValues = [
  "FORWARDED_TO_WHATSAPP",
  "IN_NEGOTIATION",
  "CONFIRMED",
  "NOT_CONVERTED"
] as const;

export type WhatsAppOrderStatus = typeof whatsappOrderStatusEnum.enumValues[number];
export type WhatsAppOrderManualStatus = typeof whatsappOrderStatusValues[number];
