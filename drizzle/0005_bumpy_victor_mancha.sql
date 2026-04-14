CREATE TABLE "order_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"color" varchar(30) DEFAULT 'gray' NOT NULL,
	"icon" varchar(50) DEFAULT 'Circle' NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_statuses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"shipping_method_id" uuid,
	"gateway_type" varchar(50),
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_flows_shipping_gateway_unique" UNIQUE("shipping_method_id","gateway_type")
);
--> statement-breakpoint
CREATE TABLE "order_flow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" uuid NOT NULL,
	"status_slug" varchar(50) NOT NULL,
	"step_order" integer NOT NULL,
	"auto_transition" boolean DEFAULT false NOT NULL,
	"notify_customer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_flow_steps_flow_order_unique" UNIQUE("flow_id","step_order"),
	CONSTRAINT "order_flow_steps_flow_status_unique" UNIQUE("flow_id","status_slug")
);
--> statement-breakpoint
ALTER TABLE "locales" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promotion_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "catalog_pages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "catalog_presets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "affiliates_commissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "affiliates_payouts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "affiliates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "support_activity_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "locales" CASCADE;--> statement-breakpoint
DROP TABLE "promotion_items" CASCADE;--> statement-breakpoint
DROP TABLE "catalog_pages" CASCADE;--> statement-breakpoint
DROP TABLE "catalog_presets" CASCADE;--> statement-breakpoint
DROP TABLE "affiliates_commissions" CASCADE;--> statement-breakpoint
DROP TABLE "affiliates_payouts" CASCADE;--> statement-breakpoint
DROP TABLE "affiliates" CASCADE;--> statement-breakpoint
DROP TABLE "support_activity_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "flow_id" uuid;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "country_code" varchar(5) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_flows" ADD CONSTRAINT "order_flows_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_flow_steps" ADD CONSTRAINT "order_flow_steps_flow_id_order_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."order_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_flow_steps" ADD CONSTRAINT "order_flow_steps_status_slug_order_statuses_slug_fk" FOREIGN KEY ("status_slug") REFERENCES "public"."order_statuses"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_flow_id_order_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."order_flows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "country";--> statement-breakpoint
DROP TYPE "public"."promotion_type";--> statement-breakpoint
DROP TYPE "public"."catalog_page_type";--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
DROP TYPE "public"."affiliate_commission_status";--> statement-breakpoint
DROP TYPE "public"."affiliate_payout_status";--> statement-breakpoint
DROP TYPE "public"."affiliate_status";