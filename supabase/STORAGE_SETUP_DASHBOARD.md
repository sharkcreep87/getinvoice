# Supabase Storage Setup - Dashboard Method (Recommended)

Since the SQL method requires system-level permissions, use this dashboard approach instead.

## Step 1: Create the Storage Bucket

1. Open your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket** button
4. Configure the bucket:
   ```
   Name: company-assets
   Public bucket: ON (toggle to enabled)
   File size limit: 2MB
   Allowed MIME types: Leave blank (or add: image/jpeg, image/png, image/gif, image/webp, image/svg+xml)
   ```
5. Click **Create bucket**

## Step 2: Set Up Storage Policies

1. Still in **Storage**, click on the **company-assets** bucket you just created
2. Click the **Policies** tab
3. Click **New policy**

### Policy 1: Upload Permission

```
Policy name: Allow authenticated users to upload logos
Allowed operation: INSERT
Policy definition: Custom
Target roles: authenticated
```

**USING expression:**
```sql
bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
```

**WITH CHECK expression:**
```sql
bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
```

Click **Save policy**

### Policy 2: Update Permission

```
Policy name: Allow users to update logos
Allowed operation: UPDATE
Policy definition: Custom
Target roles: authenticated
```

**USING expression:**
```sql
bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
```

Click **Save policy**

### Policy 3: Delete Permission

```
Policy name: Allow users to delete logos
Allowed operation: DELETE
Policy definition: Custom
Target roles: authenticated
```

**USING expression:**
```sql
bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
```

Click **Save policy**

### Policy 4: Public Read Access

```
Policy name: Public read access
Allowed operation: SELECT
Policy definition: Custom
Target roles: public
```

**USING expression:**
```sql
bucket_id = 'company-assets'
```

Click **Save policy**

## Step 3: Verify Setup

1. Go to **Storage** > **company-assets** bucket
2. You should see all 4 policies listed
3. Try uploading a test image through the dashboard to verify

## Step 4: Test in Your Application

1. Log into your application
2. Navigate to **Dashboard** > **Company Settings**
3. Try uploading a company logo
4. If successful, you'll see:
   - Image preview appears
   - File is saved to `company-assets/company-logos/` in Supabase Storage
   - URL is saved in `company_settings` table

## Troubleshooting

### "Access denied" error when uploading
- Make sure all 4 policies are created
- Verify the bucket is set to "Public"
- Check that you're logged in as an authenticated user

### Image doesn't display after upload
- Go to Storage > public bucket > company-logos folder
- Check if the file exists
- Verify the public URL is accessible in a new browser tab

### Upload button doesn't work
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Make sure the user is authenticated

## Alternative: Quick Policy Setup

If you prefer, you can create all policies at once:

1. Go to **Storage** > **Policies** (not bucket-specific)
2. Click **New policy**
3. Select **For full customization**
4. Create each policy as described above

The policies will automatically apply to the correct bucket based on the `bucket_id = 'public'` condition.
