-- Add stock to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0 CHECK (stock >= 0);

COMMENT ON COLUMN public.products.stock IS 'Inventory quantity for product';
