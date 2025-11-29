-- Add currency support to existing tables
-- Run this after the main schema.sql

-- Add currency column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MYR'
CHECK (currency IN ('USD', 'MYR'));

-- Add currency column to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MYR';

-- Add currency column to payments table if it exists
ALTER TABLE public.payments
ALTER COLUMN currency SET DEFAULT 'MYR';
-- Update existing records to use MYR as default
UPDATE public.profiles SET currency = 'MYR' WHERE currency IS NULL;
UPDATE public.invoices SET currency = 'MYR' WHERE currency IS NULL;

-- Create currency_settings table for supported currencies
CREATE TABLE IF NOT EXISTS public.currency_settings (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimal_digits INTEGER NOT NULL DEFAULT 2,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Insert supported currencies
INSERT INTO public.currency_settings (code, name, symbol, decimal_digits, enabled) VALUES
    ('USD', 'US Dollar', '$', 2, true),
    ('MYR', 'Malaysian Ringgit', 'RM', 2, true)
   
ON CONFLICT (code) DO NOTHING;

-- Enable RLS for currency_settings
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read currency settings
CREATE POLICY "Anyone can view currency settings" ON public.currency_settings
    FOR SELECT USING (true);

-- Create index for faster currency lookups
CREATE INDEX IF NOT EXISTS idx_profiles_currency ON public.profiles(currency);
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON public.invoices(currency);
