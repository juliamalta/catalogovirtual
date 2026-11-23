CREATE TYPE "public"."product_availability_mode" AS ENUM('ALWAYS', 'WEEKDAYS');--> statement-breakpoint
CREATE TYPE "public"."product_option_group_kind" AS ENUM('VARIANT', 'CUSTOMIZATION');--> statement-breakpoint
CREATE TABLE "product_availability_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_availability_days_product_day_unique" UNIQUE("store_id","product_id","day_of_week"),
	CONSTRAINT "product_availability_days_weekday_check" CHECK ("product_availability_days"."day_of_week" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE TABLE "product_option_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"kind" "product_option_group_kind" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_option_groups_store_product_id_unique" UNIQUE("store_id","product_id","id"),
	CONSTRAINT "product_option_groups_selection_bounds_check" CHECK ("product_option_groups"."min_selections" >= 0 AND "product_option_groups"."max_selections" >= 1 AND "product_option_groups"."min_selections" <= "product_option_groups"."max_selections" AND "product_option_groups"."max_selections" <= 50),
	CONSTRAINT "product_option_groups_required_min_check" CHECK (("product_option_groups"."is_required" = false AND "product_option_groups"."min_selections" = 0) OR ("product_option_groups"."is_required" = true AND "product_option_groups"."min_selections" >= 1)),
	CONSTRAINT "product_option_groups_variant_single_check" CHECK ("product_option_groups"."kind" <> 'VARIANT' OR ("product_option_groups"."is_required" = true AND "product_option_groups"."min_selections" = 1 AND "product_option_groups"."max_selections" = 1))
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"price_cents" integer,
	"price_delta_cents" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_store_product_id_unique" UNIQUE("store_id","product_id","id"),
	CONSTRAINT "product_options_group_name_unique" UNIQUE("store_id","product_id","group_id","name"),
	CONSTRAINT "product_options_prices_nonnegative_check" CHECK ("product_options"."price_delta_cents" >= 0 AND ("product_options"."price_cents" IS NULL OR ("product_options"."price_cents" >= 0 AND "product_options"."price_delta_cents" = 0)))
);
--> statement-breakpoint
CREATE TABLE "product_price_rule_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_rule_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	CONSTRAINT "product_price_rule_options_rule_option_unique" UNIQUE("store_id","product_id","price_rule_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "product_price_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"price_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_price_rules_store_product_id_unique" UNIQUE("store_id","product_id","id"),
	CONSTRAINT "product_price_rules_price_nonnegative_check" CHECK ("product_price_rules"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "availability_mode" "product_availability_mode" DEFAULT 'ALWAYS' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_availability_days" ADD CONSTRAINT "product_availability_days_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_groups" ADD CONSTRAINT "product_option_groups_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_group_fk" FOREIGN KEY ("store_id","product_id","group_id") REFERENCES "public"."product_option_groups"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_rule_options" ADD CONSTRAINT "product_price_rule_options_rule_fk" FOREIGN KEY ("store_id","product_id","price_rule_id") REFERENCES "public"."product_price_rules"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_rule_options" ADD CONSTRAINT "product_price_rule_options_option_fk" FOREIGN KEY ("store_id","product_id","option_id") REFERENCES "public"."product_options"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_rules" ADD CONSTRAINT "product_price_rules_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_option_groups_product_order_idx" ON "product_option_groups" USING btree ("store_id","product_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_options_group_order_idx" ON "product_options" USING btree ("store_id","product_id","group_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_price_rules_product_active_idx" ON "product_price_rules" USING btree ("store_id","product_id","is_active","sort_order");