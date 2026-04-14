-- pix likely already exists in enum; safe no-op if so
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pix' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')) THEN
    ALTER TYPE "public"."payment_method" ADD VALUE 'pix';
  END IF;
END $$;--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(5) NOT NULL,
	"name" jsonb NOT NULL,
	"flag" varchar(10) NOT NULL,
	"currency" varchar(5) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shipping_method_countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipping_method_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	CONSTRAINT "smc_method_country_unique" UNIQUE("shipping_method_id","country_id")
);
--> statement-breakpoint
CREATE TABLE "shipping_payment_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipping_method_id" uuid NOT NULL,
	"gateway_type" varchar(50) NOT NULL,
	CONSTRAINT "spr_method_gateway_unique" UNIQUE("shipping_method_id","gateway_type")
);
--> statement-breakpoint
DROP TABLE "payment_types" CASCADE;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "requires_address" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD COLUMN "pickup_config" jsonb;--> statement-breakpoint
ALTER TABLE "shipping_method_countries" ADD CONSTRAINT "shipping_method_countries_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_method_countries" ADD CONSTRAINT "shipping_method_countries_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_payment_rules" ADD CONSTRAINT "shipping_payment_rules_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE cascade ON UPDATE no action;