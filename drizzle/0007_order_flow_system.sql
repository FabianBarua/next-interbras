-- Sprint 6.1: Order Flow System - DB Tables + Migration
-- Creates order_statuses, order_flows, order_flow_steps tables
-- Migrates orders.status from enum to varchar(50)

-- 1. Create order_statuses table
CREATE TABLE IF NOT EXISTS "order_statuses" (
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

-- 2. Create order_flows table
CREATE TABLE IF NOT EXISTS "order_flows" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" jsonb NOT NULL,
    "description" jsonb,
    "shipping_method_id" uuid,
    "gateway_type" varchar(50),
    "is_default" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "order_flows_shipping_gateway_unique" UNIQUE("shipping_method_id", "gateway_type")
);

-- 3. Create order_flow_steps table
CREATE TABLE IF NOT EXISTS "order_flow_steps" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "flow_id" uuid NOT NULL,
    "status_slug" varchar(50) NOT NULL,
    "step_order" integer NOT NULL,
    "auto_transition" boolean DEFAULT false NOT NULL,
    "notify_customer" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "order_flow_steps_flow_order_unique" UNIQUE("flow_id", "step_order"),
    CONSTRAINT "order_flow_steps_flow_status_unique" UNIQUE("flow_id", "status_slug")
);

-- 4. Add foreign keys for order_flows
ALTER TABLE "order_flows" ADD CONSTRAINT "order_flows_shipping_method_id_shipping_methods_id_fk"
    FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE SET NULL;

-- 5. Add foreign keys for order_flow_steps
ALTER TABLE "order_flow_steps" ADD CONSTRAINT "order_flow_steps_flow_id_order_flows_id_fk"
    FOREIGN KEY ("flow_id") REFERENCES "order_flows"("id") ON DELETE CASCADE;

ALTER TABLE "order_flow_steps" ADD CONSTRAINT "order_flow_steps_status_slug_order_statuses_slug_fk"
    FOREIGN KEY ("status_slug") REFERENCES "order_statuses"("slug");

-- 6. Migrate orders.status from enum to varchar
-- Convert existing enum values to lowercase varchar
ALTER TABLE "orders" ALTER COLUMN "status" TYPE varchar(50) USING lower(status::text);
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';

-- 7. Add flow_id column to orders
ALTER TABLE "orders" ADD COLUMN "flow_id" uuid;
ALTER TABLE "orders" ADD CONSTRAINT "orders_flow_id_order_flows_id_fk"
    FOREIGN KEY ("flow_id") REFERENCES "order_flows"("id") ON DELETE SET NULL;

-- 8. Recreate status index with text_ops (drop enum-based index first)
DROP INDEX IF EXISTS "orders_status_idx";
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status" text_ops);

-- 9. Drop the old enum type (no longer used)
DROP TYPE IF EXISTS "order_status";
