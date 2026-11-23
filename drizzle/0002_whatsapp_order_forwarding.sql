CREATE TYPE "public"."whatsapp_order_status" AS ENUM('CLICK_RECORDED', 'FORWARDED_TO_WHATSAPP', 'IN_NEGOTIATION', 'CONFIRMED', 'NOT_CONVERTED');--> statement-breakpoint
CREATE TABLE "whatsapp_order_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"forwarding_id" uuid NOT NULL,
	"click_key" uuid NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_order_clicks_forwarding_click_unique" UNIQUE("store_id","forwarding_id","click_key")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_order_forwardings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"status" "whatsapp_order_status" DEFAULT 'CLICK_RECORDED' NOT NULL,
	"potential_value_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_updated_at" timestamp with time zone,
	"status_updated_by" text,
	CONSTRAINT "whatsapp_order_forwardings_store_id_id_unique" UNIQUE("store_id","id"),
	CONSTRAINT "whatsapp_order_forwardings_idempotency_unique" UNIQUE("store_id","idempotency_key"),
	CONSTRAINT "whatsapp_order_forwardings_potential_nonnegative_check" CHECK ("whatsapp_order_forwardings"."potential_value_cents" >= 0),
	CONSTRAINT "whatsapp_order_forwardings_manual_status_check" CHECK (("whatsapp_order_forwardings"."status" = 'CLICK_RECORDED' AND "whatsapp_order_forwardings"."status_updated_at" IS NULL) OR ("whatsapp_order_forwardings"."status" <> 'CLICK_RECORDED' AND "whatsapp_order_forwardings"."status_updated_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"forwarding_id" uuid NOT NULL,
	"product_id_snapshot" uuid NOT NULL,
	"product_name_snapshot" varchar(140) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" bigint NOT NULL,
	"line_total_cents" bigint NOT NULL,
	"selected_options_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "whatsapp_order_items_quantity_check" CHECK ("whatsapp_order_items"."quantity" BETWEEN 1 AND 99),
	CONSTRAINT "whatsapp_order_items_prices_check" CHECK ("whatsapp_order_items"."unit_price_cents" >= 0 AND "whatsapp_order_items"."line_total_cents" >= 0 AND "whatsapp_order_items"."line_total_cents" = "whatsapp_order_items"."unit_price_cents" * "whatsapp_order_items"."quantity")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_order_clicks" ADD CONSTRAINT "whatsapp_order_clicks_forwarding_fk" FOREIGN KEY ("store_id","forwarding_id") REFERENCES "public"."whatsapp_order_forwardings"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_order_forwardings" ADD CONSTRAINT "whatsapp_order_forwardings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_order_forwardings" ADD CONSTRAINT "whatsapp_order_forwardings_status_updated_by_users_id_fk" FOREIGN KEY ("status_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_order_items" ADD CONSTRAINT "whatsapp_order_items_forwarding_fk" FOREIGN KEY ("store_id","forwarding_id") REFERENCES "public"."whatsapp_order_forwardings"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_order_clicks_store_attempted_idx" ON "whatsapp_order_clicks" USING btree ("store_id","attempted_at");--> statement-breakpoint
CREATE INDEX "whatsapp_order_forwardings_store_created_idx" ON "whatsapp_order_forwardings" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_order_forwardings_store_status_created_idx" ON "whatsapp_order_forwardings" USING btree ("store_id","status","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_order_items_store_forwarding_idx" ON "whatsapp_order_items" USING btree ("store_id","forwarding_id");