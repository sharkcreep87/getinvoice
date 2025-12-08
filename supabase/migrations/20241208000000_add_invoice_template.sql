-- Add invoice_template column to company_settings table
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'classic'
CHECK (invoice_template IN ('classic', 'modern', 'minimal'));

-- Add comment to describe the column
COMMENT ON COLUMN company_settings.invoice_template IS 'Selected invoice template: classic, modern, or minimal';
