import { sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { stores } from "./store.schema";

export const storeDeliverySettings = pgTable("store_delivery_settings", {
  storeId: uuid("store_id").primaryKey().references(() => stores.id, { onDelete: "cascade" }),
  feeType: varchar("fee_type", { length: 16 }).$type<"FIXED" | "FREE" | "TO_AGREE">().notNull().default("TO_AGREE"),
  fixedFeeCents: integer("fixed_fee_cents"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("store_delivery_settings_fee_check", sql`(${table.feeType} = 'FIXED' AND ${table.fixedFeeCents} IS NOT NULL AND ${table.fixedFeeCents} BETWEEN 0 AND 999999999) OR (${table.feeType} IN ('FREE', 'TO_AGREE') AND ${table.fixedFeeCents} IS NULL)`),
]);
