-- Storage bucket for company assets (logos, etc.)
-- This needs to be created in Supabase Dashboard or via API

-- Step 1: Create storage bucket
-- Run this in Supabase SQL Editor or Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named: company-assets
-- 3. Set it to Public (so invoice PDFs can load the logos)

-- Alternative: Create via SQL (if available in your Supabase version)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up storage policies
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow public read access to all company assets
CREATE POLICY "Public read access for company assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- Allow users to update their own company logos
CREATE POLICY "Users can update their company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- Allow users to delete their own company logos
CREATE POLICY "Users can delete their company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');
