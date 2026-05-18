-- Add secondary unit measurement system for measurable products
-- This allows stock consolidation by product base (e.g., total kg of tuna)

-- 1. Add is_measurable column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_measurable BOOLEAN NOT NULL DEFAULT true;

-- 2. Add secondary_unit and secondary_quantity columns to product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS secondary_unit TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS secondary_quantity NUMERIC;

-- 3. Add check constraint for valid secondary_unit values (kg, lt only)
ALTER TABLE product_variants ADD CONSTRAINT valid_secondary_unit 
CHECK (secondary_unit IS NULL OR secondary_unit IN ('kg', 'lt'));

-- 4. Add check constraint for secondary_quantity positive
ALTER TABLE product_variants ADD CONSTRAINT positive_secondary_quantity 
CHECK (secondary_quantity IS NULL OR secondary_quantity > 0);

-- 5. Update RLS policies to include new columns (read-only for anon/authenticated)
-- Products: allow read access
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON products;
CREATE POLICY "Products are viewable by authenticated users" ON products
  FOR SELECT USING (true);

-- Product variants: allow read access  
DROP POLICY IF EXISTS "Product variants are viewable by authenticated users" ON product_variants;
CREATE POLICY "Product variants are viewable by authenticated users" ON product_variants
  FOR SELECT USING (true);

-- 6. Create index for efficient stock consolidation queries
CREATE INDEX IF NOT EXISTS idx_product_variants_secondary_unit ON product_variants(secondary_unit) WHERE secondary_unit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_measurable ON products(is_measurable);