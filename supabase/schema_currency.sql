-- Add currency support to existing tables
-- Run this after the main schema.sql

-- Add currency column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'THB', 'MYR', 'PHP', 'IDR', 'KRW', 'TRY', 'AED', 'SAR'));

-- Add currency column to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Add currency column to payments table if it exists
ALTER TABLE public.payments
ALTER COLUMN currency SET DEFAULT 'USD';

-- Update existing records to use USD as default
UPDATE public.profiles SET currency = 'USD' WHERE currency IS NULL;
UPDATE public.invoices SET currency = 'USD' WHERE currency IS NULL;

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
    ('EUR', 'Euro', '€', 2, true),
    ('GBP', 'British Pound', '£', 2, true),
    ('JPY', 'Japanese Yen', '¥', 0, true),
    ('AUD', 'Australian Dollar', 'A$', 2, true),
    ('CAD', 'Canadian Dollar', 'C$', 2, true),
    ('CHF', 'Swiss Franc', 'CHF', 2, true),
    ('CNY', 'Chinese Yuan', '¥', 2, true),
    ('INR', 'Indian Rupee', '₹', 2, true),
    ('MXN', 'Mexican Peso', '$', 2, true),
    ('BRL', 'Brazilian Real', 'R$', 2, true),
    ('ZAR', 'South African Rand', 'R', 2, true),
    ('SGD', 'Singapore Dollar', 'S$', 2, true),
    ('HKD', 'Hong Kong Dollar', 'HK$', 2, true),
    ('NZD', 'New Zealand Dollar', 'NZ$', 2, true),
    ('SEK', 'Swedish Krona', 'kr', 2, true),
    ('NOK', 'Norwegian Krone', 'kr', 2, true),
    ('DKK', 'Danish Krone', 'kr', 2, true),
    ('PLN', 'Polish Zloty', 'zł', 2, true),
    ('THB', 'Thai Baht', '฿', 2, true),
    ('MYR', 'Malaysian Ringgit', 'RM', 2, true),
    ('PHP', 'Philippine Peso', '₱', 2, true),
    ('IDR', 'Indonesian Rupiah', 'Rp', 0, true),
    ('KRW', 'South Korean Won', '₩', 0, true),
    ('TRY', 'Turkish Lira', '₺', 2, true),
    ('AED', 'UAE Dirham', 'د.إ', 2, true),
    ('SAR', 'Saudi Riyal', 'ر.س', 2, true)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS for currency_settings
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read currency settings
CREATE POLICY "Anyone can view currency settings" ON public.currency_settings
    FOR SELECT USING (true);

-- Create index for faster currency lookups
CREATE INDEX IF NOT EXISTS idx_profiles_currency ON public.profiles(currency);
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON public.invoices(currency);
