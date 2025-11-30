-- Add product reference on invoice_items
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add stock_reserved flag on invoices to track whether an invoice's items have been reserved
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN DEFAULT FALSE;

-- Function: handle invoice stock reservation/restoration
CREATE OR REPLACE FUNCTION public.handle_invoice_stock()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  current_stock INTEGER;
BEGIN
  -- When creating or updating an invoice to a finalized status, mark it reserved and
  -- decrement stock for existing items (if any). Use BEFORE so we can set NEW.stock_reserved
  -- without causing recursive updates.

  IF (TG_OP = 'INSERT' AND NEW.status IN ('sent', 'paid')) OR
     (TG_OP = 'UPDATE' AND NEW.status IN ('sent', 'paid') AND COALESCE(OLD.stock_reserved, false) = false) THEN

    -- If there are existing items, validate stock and decrement now
    FOR rec IN SELECT product_id, quantity FROM public.invoice_items WHERE invoice_id = NEW.id AND product_id IS NOT NULL LOOP
      SELECT stock INTO current_stock FROM public.products WHERE id = rec.product_id;
      IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', rec.product_id;
      END IF;
      IF current_stock < rec.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)', rec.product_id, rec.quantity, current_stock;
      END IF;
    END LOOP;

    -- Deduct stock for any existing items
    UPDATE public.products p
      SET stock = stock - ii.quantity
      FROM public.invoice_items ii
      WHERE ii.invoice_id = NEW.id AND ii.product_id = p.id;

    -- mark the invoice as reserved so subsequent item insert/update triggers will respect it
    NEW.stock_reserved = true;

    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND COALESCE(OLD.stock_reserved, false) = true) THEN

    -- Restore stock when invoice is cancelled (only when it had reserved stock)
    UPDATE public.products p
      SET stock = stock + ii.quantity
      FROM public.invoice_items ii
      WHERE ii.invoice_id = NEW.id AND ii.product_id = p.id;

    NEW.stock_reserved = false;
    RETURN NEW;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_invoice_stock
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_stock();

-- Function: when invoice_items are changed and parent invoice.stock_reserved = true
-- we need to decrement/add stock accordingly
CREATE OR REPLACE FUNCTION public.handle_invoice_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  inv_stock_reserved BOOLEAN;
  current_stock INTEGER;
BEGIN
  SELECT stock_reserved INTO inv_stock_reserved FROM public.invoices WHERE id = NEW.invoice_id;
  IF inv_stock_reserved = TRUE AND NEW.product_id IS NOT NULL THEN
    SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', NEW.product_id;
    END IF;
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)', NEW.product_id, NEW.quantity, current_stock;
    END IF;
    UPDATE public.products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_item_insert
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_item_insert();

CREATE OR REPLACE FUNCTION public.handle_invoice_item_update()
RETURNS TRIGGER AS $$
DECLARE
  inv_stock_reserved BOOLEAN;
  diff NUMERIC;
  current_stock INTEGER;
BEGIN
  SELECT stock_reserved INTO inv_stock_reserved FROM public.invoices WHERE id = NEW.invoice_id;
  IF inv_stock_reserved = TRUE THEN
    -- Only adjust when item is linked to a product
    IF NEW.product_id IS NOT NULL THEN
      IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
        -- product changed: restore old and deduct new
        IF OLD.product_id IS NOT NULL THEN
          UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
        END IF;
        SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
        IF current_stock IS NULL THEN
          RAISE EXCEPTION 'Product not found: %', NEW.product_id;
        END IF;
        IF current_stock < NEW.quantity THEN
          RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)', NEW.product_id, NEW.quantity, current_stock;
        END IF;
        UPDATE public.products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
      ELSE
        -- same product: adjust by quantity diff
        diff := NEW.quantity - COALESCE(OLD.quantity, 0);
        IF diff > 0 THEN
          SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
          IF current_stock IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', NEW.product_id;
          END IF;
          IF current_stock < diff THEN
            RAISE EXCEPTION 'Insufficient stock for product % (need %, have %)', NEW.product_id, diff, current_stock;
          END IF;
          UPDATE public.products SET stock = stock - diff WHERE id = NEW.product_id;
        ELSIF diff < 0 THEN
          UPDATE public.products SET stock = stock + ABS(diff) WHERE id = NEW.product_id;
        END IF;
      END IF;
    ELSE
      -- NEW.product_id null but OLD had a product -> return old stock
      IF OLD.product_id IS NOT NULL THEN
        UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_item_update
  AFTER UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_item_update();

CREATE OR REPLACE FUNCTION public.handle_invoice_item_delete()
RETURNS TRIGGER AS $$
DECLARE
  inv_stock_reserved BOOLEAN;
BEGIN
  SELECT stock_reserved INTO inv_stock_reserved FROM public.invoices WHERE id = OLD.invoice_id;
  IF inv_stock_reserved = TRUE AND OLD.product_id IS NOT NULL THEN
    UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_item_delete
  AFTER DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_item_delete();
