-- Step 2: addresses.countryCode replaces addresses.country
ALTER TABLE "addresses" ADD COLUMN "country_code" varchar(5);

-- Backfill: existing addresses default to PY
UPDATE "addresses" SET "country_code" = 'PY' WHERE "country_code" IS NULL;

-- Make non-nullable
ALTER TABLE "addresses" ALTER COLUMN "country_code" SET NOT NULL;

-- Drop the old freeform country column
ALTER TABLE "addresses" DROP COLUMN "country";
