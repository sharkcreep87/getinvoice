-- Create product_links table for shareable links
CREATE TABLE IF NOT EXISTS public.product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  link_type TEXT NOT NULL CHECK (link_type IN ('product', 'catalog')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INTEGER NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT product_link_check CHECK (
    (link_type = 'product' AND product_id IS NOT NULL) OR
    (link_type = 'catalog' AND product_id IS NULL)
  )
);

-- Create indexes for product_links
CREATE INDEX IF NOT EXISTS idx_product_links_user_id ON public.product_links(user_id);
CREATE INDEX IF NOT EXISTS idx_product_links_token ON public.product_links(token);
CREATE INDEX IF NOT EXISTS idx_product_links_product_id ON public.product_links(product_id);

-- Create product_orders table
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  link_id UUID REFERENCES public.product_links(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for product_orders
CREATE INDEX IF NOT EXISTS idx_product_orders_user_id ON public.product_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_product_id ON public.product_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_link_id ON public.product_orders(link_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON public.product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_created_at ON public.product_orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_links
-- Users can view their own links
CREATE POLICY "Users can view own links"
  ON public.product_links FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own links
CREATE POLICY "Users can create own links"
  ON public.product_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update own links"
  ON public.product_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own links"
  ON public.product_links FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_orders
-- Users can view orders for their products
CREATE POLICY "Users can view own orders"
  ON public.product_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can create orders (public order form)
CREATE POLICY "Anyone can create orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (true);

-- Users can update their own orders
CREATE POLICY "Users can update own orders"
  ON public.product_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own orders
CREATE POLICY "Users can delete own orders"
  ON public.product_orders FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on product_links
CREATE TRIGGER set_product_links_updated_at
  BEFORE UPDATE ON public.product_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on product_orders
CREATE TRIGGER set_product_orders_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_link_view_count(link_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_links
  SET view_count = view_count + 1
  WHERE token = link_token AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment order count
CREATE OR REPLACE FUNCTION increment_link_order_count(link_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_links
  SET order_count = order_count + 1
  WHERE token = link_token AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
