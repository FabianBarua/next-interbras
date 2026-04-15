-- Move stock from variants to external_codes

-- 1. Add stock column to external_codes
ALTER TABLE external_codes ADD COLUMN stock integer;

-- 2. Copy stock from linked variants
UPDATE external_codes ec
SET stock = v.stock
FROM variants v
WHERE ec.variant_id = v.id AND v.stock IS NOT NULL;

-- 3. Enforce 1:1 (one variant can link to at most one external code)
CREATE UNIQUE INDEX external_codes_variant_id_unique
ON external_codes (variant_id) WHERE variant_id IS NOT NULL;

-- 4. Drop stock from variants
ALTER TABLE variants DROP COLUMN stock;
