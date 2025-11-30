-- Add cost_price field to products table for pricing calculator
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0 CHECK (cost_price >= 0);

-- Add comment explaining the field
COMMENT ON COLUMN public.products.cost_price IS 'Base cost price for pricing calculator and margin calculations';
