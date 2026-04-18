-- Migration 0012: Variants → relational attribute values; drop variants.sku, variants.options, products.sort_order
-- Strict 1:1 (variants ↔ external_codes) is already enforced by the existing unique index on external_codes.variant_id.
-- Orphan external_codes (variant_id IS NULL) are real catalog data (accessories) — kept as-is. Nullable variant_id stays.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Slugify helper (unaccent + lower + non-alnum → '-')
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION pg_temp.slugify(input text) RETURNS text AS $$
  SELECT trim(both '-' from regexp_replace(lower(unaccent(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create variant_attribute_values table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "variant_attribute_values" (
  "variant_id" uuid NOT NULL REFERENCES "variants"("id") ON DELETE CASCADE,
  "attribute_id" uuid NOT NULL REFERENCES "attributes"("id") ON DELETE RESTRICT,
  "attribute_value_id" uuid NOT NULL REFERENCES "attribute_values"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("variant_id", "attribute_value_id")
);

CREATE UNIQUE INDEX "variant_attribute_values_variant_attr_unique"
  ON "variant_attribute_values" ("variant_id", "attribute_id");
CREATE INDEX "variant_attribute_values_attribute_value_idx"
  ON "variant_attribute_values" ("attribute_value_id");
CREATE INDEX "variant_attribute_values_attribute_idx"
  ON "variant_attribute_values" ("attribute_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Backfill: for each (variant, options json pair) → upsert attribute + value, insert join row
-- ─────────────────────────────────────────────────────────────────────────────
DO $migration$
DECLARE
  r RECORD;
  attr_slug text;
  val_slug text;
  attr_id uuid;
  val_id uuid;
  attr_name jsonb;
  val_name jsonb;
BEGIN
  FOR r IN
    SELECT v.id AS variant_id, kv.key AS k, kv.value AS v
    FROM variants v, jsonb_each_text(v.options) kv
    WHERE v.options IS NOT NULL AND v.options::text <> '{}'
  LOOP
    attr_slug := pg_temp.slugify(r.k);
    val_slug  := pg_temp.slugify(r.v);

    IF attr_slug = '' OR val_slug = '' THEN
      CONTINUE;
    END IF;

    -- Upsert attribute
    SELECT id INTO attr_id FROM attributes WHERE slug = attr_slug;
    IF attr_id IS NULL THEN
      attr_name := jsonb_build_object('es', initcap(r.k), 'pt', initcap(r.k));
      INSERT INTO attributes (slug, name, sort_order, active)
      VALUES (attr_slug, attr_name, 0, true)
      RETURNING id INTO attr_id;
    END IF;

    -- Upsert attribute_value (scoped by attribute)
    SELECT id INTO val_id FROM attribute_values
      WHERE attribute_id = attr_id AND slug = val_slug;
    IF val_id IS NULL THEN
      val_name := jsonb_build_object('es', r.v, 'pt', r.v);
      INSERT INTO attribute_values (attribute_id, slug, name, sort_order, active)
      VALUES (attr_id, val_slug, val_name, 0, true)
      RETURNING id INTO val_id;
    END IF;

    -- Insert join row (ignore conflicts on PK or unique constraint)
    INSERT INTO variant_attribute_values (variant_id, attribute_id, attribute_value_id)
    VALUES (r.variant_id, attr_id, val_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END
$migration$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Drop columns no longer needed
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "variants" DROP COLUMN IF EXISTS "sku";
ALTER TABLE "variants" DROP COLUMN IF EXISTS "options";
ALTER TABLE "products" DROP COLUMN IF EXISTS "sort_order";

-- Drop redundant non-unique index on external_codes.variant_id (unique index already covers it)
DROP INDEX IF EXISTS "external_codes_variant_id_idx";

COMMIT;
