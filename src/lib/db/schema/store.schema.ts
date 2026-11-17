import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";

export const storefrontTypeEnum = pgEnum("storefront_type", ["MENU", "CATALOG", "SHOWCASE"]);
export const storeStatusEnum = pgEnum("store_status", ["DRAFT", "PUBLISHED"]);
export const storeMemberRoleEnum = pgEnum("store_member_role", ["OWNER", "ADMIN", "MEMBER"]);

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

export const storeSettings = pgTable("store_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().unique().references(() => stores.id, { onDelete: "cascade" }),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#7351D6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).notNull().default("#F5F2FF"),
  headline: varchar("headline", { length: 180 }).notNull().default(""),
  subtitle: varchar("subtitle", { length: 280 }).notNull().default(""),
  openingHours: jsonb("opening_hours").$type<Record<string, string>>().notNull().default({}),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  pickupEnabled: boolean("pickup_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("store_settings_primary_color_check", sql`${table.primaryColor} ~ '^#[0-9A-Fa-f]{6}$'`),
  check("store_settings_secondary_color_check", sql`${table.secondaryColor} ~ '^#[0-9A-Fa-f]{6}$'`)
]);

