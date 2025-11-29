-- Add currency field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR'));

-- Add comment to the column
COMMENT ON COLUMN public.profiles.currency IS 'User preferred currency for invoices (USD or MYR)';
