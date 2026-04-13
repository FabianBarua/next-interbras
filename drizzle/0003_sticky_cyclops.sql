CREATE TYPE "public"."document_type" AS ENUM('CI', 'CPF', 'RG', 'OTRO');--> statement-breakpoint
CREATE TABLE "order_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "document_type" "document_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "document_number" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nationality" varchar(100);--> statement-breakpoint
UPDATE "users" SET "document_type" = 'CPF', "document_number" = "cpf" WHERE "cpf" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "svg_icon" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "svg_icon_meta" jsonb;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "cpf";