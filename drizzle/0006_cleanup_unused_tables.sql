-- Drop unused tables: catalog presets, affiliates, support activity logs, promotion items
-- These tables have no application code referencing them

DROP TABLE IF EXISTS "catalog_pages" CASCADE;
DROP TABLE IF EXISTS "catalog_presets" CASCADE;
DROP TABLE IF EXISTS "support_activity_logs" CASCADE;
DROP TABLE IF EXISTS "affiliates_commissions" CASCADE;
DROP TABLE IF EXISTS "affiliates_payouts" CASCADE;
DROP TABLE IF EXISTS "affiliates" CASCADE;
DROP TABLE IF EXISTS "promotion_items" CASCADE;
DROP TABLE IF EXISTS "locales" CASCADE;

-- Drop associated enums
DROP TYPE IF EXISTS "catalog_page_type" CASCADE;
DROP TYPE IF EXISTS "affiliate_status" CASCADE;
DROP TYPE IF EXISTS "affiliate_commission_status" CASCADE;
DROP TYPE IF EXISTS "affiliate_payout_status" CASCADE;
DROP TYPE IF EXISTS "promotion_type" CASCADE;
