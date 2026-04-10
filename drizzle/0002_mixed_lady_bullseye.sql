ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source_domain" varchar(255);