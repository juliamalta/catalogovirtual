CREATE TABLE "store_delivery_settings" (
	"store_id" uuid PRIMARY KEY NOT NULL,
	"fee_type" varchar(16) DEFAULT 'TO_AGREE' NOT NULL,
	"fixed_fee_cents" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_delivery_settings_fee_check" CHECK (("store_delivery_settings"."fee_type" = 'FIXED' AND "store_delivery_settings"."fixed_fee_cents" IS NOT NULL AND "store_delivery_settings"."fixed_fee_cents" BETWEEN 0 AND 999999999) OR ("store_delivery_settings"."fee_type" IN ('FREE', 'TO_AGREE') AND "store_delivery_settings"."fixed_fee_cents" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "store_delivery_settings" ADD CONSTRAINT "store_delivery_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;