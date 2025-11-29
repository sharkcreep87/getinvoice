-- ============================================
-- Supabase Storage Setup Script
-- ============================================
-- Run this script in your Supabase SQL Editor to set up storage for company logos
-- Note: You must create the bucket 'public' manually via the dashboard first

-- Step 1: Create the storage bucket (if not exists)
-- This might not work in all Supabase versions, create manually via dashboard if it fails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads to company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Step 4: Create storage policies

-- Allow authenticated users to upload to company-logos folder
CREATE POLICY "Allow authenticated uploads to company-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to update files in company-logos folder
CREATE POLICY "Allow users to update own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to delete files in company-logos folder
CREATE POLICY "Allow users to delete own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow public read access to all files in the public bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

-- Step 5: Verify setup
SELECT
  'Bucket created successfully' as message,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'public';

SELECT
  'Storage policies created' as message,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
