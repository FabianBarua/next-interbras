-- Remove product-level images (only variants should have images)
DELETE FROM product_images WHERE variant_id IS NULL;

-- Make variant_id NOT NULL
ALTER TABLE product_images ALTER COLUMN variant_id SET NOT NULL;

-- Change FK onDelete from SET NULL to CASCADE
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_variant_id_variants_id_fk;
ALTER TABLE product_images
  ADD CONSTRAINT product_images_variant_id_variants_id_fk
  FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE;
