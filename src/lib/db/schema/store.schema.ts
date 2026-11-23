import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import type { BusinessHoursConfiguration } from "@/types/business-hours.types";

export const storefrontTypeEnum = pgEnum("storefront_type", ["MENU", "CATALOG", "SHOWCASE"]);
export const storeStatusEnum = pgEnum("store_status", ["DRAFT", "PUBLISHED"]);
export const storeMemberRoleEnum = pgEnum("store_member_role", ["OWNER", "ADMIN", "MEMBER"]);
export const productAvailabilityModeEnum = pgEnum("product_availability_mode", ["ALWAYS", "WEEKDAYS"]);
export const productOptionGroupKindEnum = pgEnum("product_option_group_kind", ["VARIANT", "CUSTOMIZATION"]);

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull(),
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  whatsappNumber: varchar("whatsapp_number", { length: 16 }).notNull(),
  storefrontType: storefrontTypeEnum("storefront_type").notNull().default("CATALOG"),
  status: storeStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("stores_slug_unique").on(table.slug),
  unique("stores_id_unique").on(table.id),
  check("stores_slug_format_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`)
]);

export const storeMembers = pgTable("store_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => (users).id, { onDelete: "cascade" }),
  role: storeMemberRoleEnum("role").notNull().default("MEMBER"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("store_members_store_user_unique").on(table.storeId, table.userId),
  index("store_members_user_id_idx").on(table.userId),
  index("store_members_store_id_idx").on(table.storeId)
]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 90 }).notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("categories_store_slug_unique").on(table.storeId, table.slug),
  unique("categories_store_id_id_unique").on(table.storeId, table.id),
  index("categories_store_order_idx").on(table.storeId, table.sortOrder)
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id"),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  availabilityMode: productAvailabilityModeEnum("availability_mode").notNull().default("ALWAYS"),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("products_store_slug_unique").on(table.storeId, table.slug),
  unique("products_store_id_id_unique").on(table.storeId, table.id),
  foreignKey({ name: "products_store_category_fk", columns: [table.storeId, table.categoryId], foreignColumns: [categories.storeId, categories.id] }).onDelete("restrict"),
  index("products_store_active_order_idx").on(table.storeId, table.isActive, table.sortOrder),
  index("products_store_category_idx").on(table.storeId, table.categoryId),
  check("products_price_nonnegative_check", sql`${table.priceCents} >= 0`)
]);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: varchar("alt_text", { length: 240 }).notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("product_images_product_order_idx").on(table.productId, table.sortOrder)]);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  optionGroup: varchar("option_group", { length: 60 }).notNull().default("Opção"),
  value: varchar("value", { length: 80 }).notNull(),
  priceDeltaCents: integer("price_delta_cents").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0)
}, (table) => [
  unique("product_variants_product_value_unique").on(table.productId, table.optionGroup, table.value),
  index("product_variants_product_order_idx").on(table.productId, table.sortOrder),
  check("product_variants_price_delta_check", sql`${table.priceDeltaCents} >= 0`)
]);

export const productOptionGroups = pgTable("product_option_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  productId: uuid("product_id").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  kind: productOptionGroupKindEnum("kind").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  minSelections: integer("min_selections").notNull().default(0),
  maxSelections: integer("max_selections").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("product_option_groups_store_product_id_unique").on(table.storeId, table.productId, table.id),
  index("product_option_groups_product_order_idx").on(table.storeId, table.productId, table.sortOrder),
  foreignKey({ name: "product_option_groups_store_product_fk", columns: [table.storeId, table.productId], foreignColumns: [products.storeId, products.id] }).onDelete("cascade"),
  check("product_option_groups_selection_bounds_check", sql`${table.minSelections} >= 0 AND ${table.maxSelections} >= 1 AND ${table.minSelections} <= ${table.maxSelections} AND ${table.maxSelections} <= 50`),
  check("product_option_groups_required_min_check", sql`(${table.isRequired} = false AND ${table.minSelections} = 0) OR (${table.isRequired} = true AND ${table.minSelections} >= 1)`),
  check("product_option_groups_variant_single_check", sql`${table.kind} <> 'VARIANT' OR (${table.isRequired} = true AND ${table.minSelections} = 1 AND ${table.maxSelections} = 1)`)
]);

export const productOptions = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  productId: uuid("product_id").notNull(),
  groupId: uuid("group_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  priceCents: integer("price_cents"),
  priceDeltaCents: integer("price_delta_cents").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("product_options_store_product_id_unique").on(table.storeId, table.productId, table.id),
  unique("product_options_group_name_unique").on(table.storeId, table.productId, table.groupId, table.name),
  index("product_options_group_order_idx").on(table.storeId, table.productId, table.groupId, table.sortOrder),
  foreignKey({ name: "product_options_group_fk", columns: [table.storeId, table.productId, table.groupId], foreignColumns: [productOptionGroups.storeId, productOptionGroups.productId, productOptionGroups.id] }).onDelete("cascade"),
  check("product_options_prices_nonnegative_check", sql`${table.priceDeltaCents} >= 0 AND (${table.priceCents} IS NULL OR (${table.priceCents} >= 0 AND ${table.priceDeltaCents} = 0))`)
]);

export const productPriceRules = pgTable("product_price_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  productId: uuid("product_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  priceCents: integer("price_cents").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("product_price_rules_store_product_id_unique").on(table.storeId, table.productId, table.id),
  index("product_price_rules_product_active_idx").on(table.storeId, table.productId, table.isActive, table.sortOrder),
  foreignKey({ name: "product_price_rules_store_product_fk", columns: [table.storeId, table.productId], foreignColumns: [products.storeId, products.id] }).onDelete("cascade"),
  check("product_price_rules_price_nonnegative_check", sql`${table.priceCents} >= 0`)
]);

export const productPriceRuleOptions = pgTable("product_price_rule_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  productId: uuid("product_id").notNull(),
  priceRuleId: uuid("price_rule_id").notNull(),
  optionId: uuid("option_id").notNull()
}, (table) => [
  unique("product_price_rule_options_rule_option_unique").on(table.storeId, table.productId, table.priceRuleId, table.optionId),
  foreignKey({ name: "product_price_rule_options_rule_fk", columns: [table.storeId, table.productId, table.priceRuleId], foreignColumns: [productPriceRules.storeId, productPriceRules.productId, productPriceRules.id] }).onDelete("cascade"),
  foreignKey({ name: "product_price_rule_options_option_fk", columns: [table.storeId, table.productId, table.optionId], foreignColumns: [productOptions.storeId, productOptions.productId, productOptions.id] }).onDelete("cascade")
]);

export const productAvailabilityDays = pgTable("product_availability_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull(),
  productId: uuid("product_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("product_availability_days_product_day_unique").on(table.storeId, table.productId, table.dayOfWeek),
  foreignKey({ name: "product_availability_days_store_product_fk", columns: [table.storeId, table.productId], foreignColumns: [products.storeId, products.id] }).onDelete("cascade"),
  check("product_availability_days_weekday_check", sql`${table.dayOfWeek} BETWEEN 1 AND 7`)
]);

export const storeSettings = pgTable("store_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().unique().references(() => stores.id, { onDelete: "cascade" }),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#7351D6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).notNull().default("#F5F2FF"),
  headline: varchar("headline", { length: 180 }).notNull().default(""),
  subtitle: varchar("subtitle", { length: 280 }).notNull().default(""),
  openingHours: jsonb("opening_hours").$type<BusinessHoursConfiguration | Record<string, unknown>>().notNull().default({}),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  pickupEnabled: boolean("pickup_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("store_settings_primary_color_check", sql`${table.primaryColor} ~ '^#[0-9A-Fa-f]{6}$'`),
  check("store_settings_secondary_color_check", sql`${table.secondaryColor} ~ '^#[0-9A-Fa-f]{6}$'`)
]);

