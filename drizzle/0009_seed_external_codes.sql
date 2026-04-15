-- Truncate external_codes (cascade to promotion_items)
TRUNCATE TABLE external_codes CASCADE;

-- Make variant_id nullable (so we can import without linking)
ALTER TABLE external_codes ALTER COLUMN variant_id DROP NOT NULL;
