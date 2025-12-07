-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Create indexes for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_predefined ON public.expense_categories(is_predefined);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date DESC);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
-- Users can view their own categories AND all predefined categories
CREATE POLICY "Users can view own and predefined categories"
  ON public.expense_categories FOR SELECT
  USING (auth.uid() = user_id OR is_predefined = TRUE);

CREATE POLICY "Users can insert own categories"
  ON public.expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_predefined = FALSE);

CREATE POLICY "Users can update own custom categories"
  ON public.expense_categories FOR UPDATE
  USING (auth.uid() = user_id AND is_predefined = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_predefined = FALSE);

CREATE POLICY "Users can delete own custom categories"
  ON public.expense_categories FOR DELETE
  USING (auth.uid() = user_id AND is_predefined = FALSE);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create predefined categories for a user
CREATE OR REPLACE FUNCTION create_predefined_categories_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.expense_categories (user_id, name, is_predefined)
  VALUES
    (p_user_id, 'Travel', TRUE),
    (p_user_id, 'Office Supplies', TRUE),
    (p_user_id, 'Utilities', TRUE),
    (p_user_id, 'Meals & Entertainment', TRUE),
    (p_user_id, 'Equipment', TRUE),
    (p_user_id, 'Software & Subscriptions', TRUE),
    (p_user_id, 'Marketing & Advertising', TRUE),
    (p_user_id, 'Other', TRUE)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create predefined categories for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    PERFORM create_predefined_categories_for_user(user_record.id);
  END LOOP;
END;
$$;

-- Trigger to create predefined categories for new users
CREATE OR REPLACE FUNCTION create_categories_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_predefined_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_create_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_categories_on_user_creation();

-- Trigger for updated_at on expense_categories
CREATE TRIGGER set_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on expenses
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
