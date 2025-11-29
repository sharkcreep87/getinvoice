# Supabase Storage Setup Guide

This guide explains how to set up the storage bucket for company logo uploads.

## Creating the Storage Bucket

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `public`
   - **Public bucket**: Toggle ON (this makes files publicly accessible)
   - Click **Create bucket**

### Option 2: Using Supabase SQL Editor

Run this in the SQL Editor:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;
```

## Setting Up Storage Policies

After creating the bucket, set up Row Level Security policies:

### Option 1: Using Supabase Dashboard

1. Go to **Storage** > **Policies**
2. Select the `public` bucket
3. Create the following policies:

**Policy 1: Allow authenticated users to upload**
- Policy name: `Allow authenticated uploads to company-logos`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
```sql
bucket_id = 'public' AND (storage.foldername(name))[1] = 'company-logos'
```

**Policy 2: Allow users to update their own files**
- Policy name: `Allow users to update own company logos`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- Policy definition:
```sql
bucket_id = 'public' AND (storage.foldername(name))[1] = 'company-logos'
```

**Policy 3: Allow users to delete their own files**
- Policy name: `Allow users to delete own company logos`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
```sql
bucket_id = 'public' AND (storage.foldername(name))[1] = 'company-logos'
```

**Policy 4: Allow public read access**
- Policy name: `Allow public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition:
```sql
bucket_id = 'public'
```

### Option 2: Using SQL

Run this in the SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload to company-logos folder
CREATE POLICY "Allow authenticated uploads to company-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');
```

## File Upload Configuration

The application is configured to:
- Upload files to: `public/company-logos/{user_id}-{timestamp}.{extension}`
- Max file size: 2MB
- Allowed types: image/* (PNG, JPG, SVG, etc.)
- Public access: Enabled (files are publicly accessible via URL)

## Testing the Setup

1. Log into your application
2. Navigate to **Dashboard** > **Company Settings**
3. Try uploading a company logo
4. Verify the image appears in the preview
5. Check that the image URL is saved in the `company_settings` table
6. Verify the uploaded file appears in Supabase Storage under `public/company-logos/`

## Troubleshooting

### Upload fails with "Access denied"
- Check that the `public` bucket exists
- Verify that policies are correctly set up
- Ensure the user is authenticated

### Image doesn't display after upload
- Check that the bucket is set to "Public"
- Verify the public URL is being generated correctly
- Check browser console for CORS errors

### File size errors
- The application enforces a 2MB limit
- This is set in the frontend code at `src/app/dashboard/company/page.tsx:79`
- Adjust if needed for your requirements

## Security Considerations

- Files are stored with unique names: `{user_id}-{timestamp}.{extension}`
- Only authenticated users can upload
- File type validation is done on the frontend (add backend validation for production)
- Consider implementing file size limits at the database level
- Old logos are not automatically deleted (consider implementing cleanup)
