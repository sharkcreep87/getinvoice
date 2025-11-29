# Quick Storage Setup Checklist

Follow these steps in your Supabase Dashboard to enable logo uploads.

## ✅ Step-by-Step Checklist

### 1. Create the Bucket
- [ ] Go to **Storage** in left sidebar
- [ ] Click **New bucket**
- [ ] Name: `company-assets`
- [ ] Toggle **Public bucket** to ON
- [ ] Click **Create bucket**

### 2. Create Policy #1 - Upload
- [ ] Click on **company-assets** bucket
- [ ] Go to **Policies** tab
- [ ] Click **New policy**
- [ ] Fill in:
  - Name: `Allow authenticated users to upload logos`
  - Operation: `INSERT`
  - Target roles: `authenticated`
  - Policy definition: `Custom`
- [ ] USING expression:
  ```sql
  bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
  ```
- [ ] WITH CHECK expression:
  ```sql
  bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
  ```
- [ ] Click **Save policy**

### 3. Create Policy #2 - Update
- [ ] Click **New policy** again
- [ ] Fill in:
  - Name: `Allow users to update logos`
  - Operation: `UPDATE`
  - Target roles: `authenticated`
  - Policy definition: `Custom`
- [ ] USING expression:
  ```sql
  bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
  ```
- [ ] Click **Save policy**

### 4. Create Policy #3 - Delete
- [ ] Click **New policy** again
- [ ] Fill in:
  - Name: `Allow users to delete logos`
  - Operation: `DELETE`
  - Target roles: `authenticated`
  - Policy definition: `Custom`
- [ ] USING expression:
  ```sql
  bucket_id = 'company-assets' AND (storage.foldername(name))[1] = 'company-logos'
  ```
- [ ] Click **Save policy**

### 5. Create Policy #4 - Public Read
- [ ] Click **New policy** again
- [ ] Fill in:
  - Name: `Public read access`
  - Operation: `SELECT`
  - Target roles: `public`
  - Policy definition: `Custom`
- [ ] USING expression:
  ```sql
  bucket_id = 'company-assets'
  ```
- [ ] Click **Save policy**

### 6. Verify
- [ ] You should see 4 policies listed under the company-assets bucket
- [ ] Try uploading a test image in **Storage** > **company-assets** bucket
- [ ] If upload works, setup is complete!

## 🎉 Test in Your App

1. Run your app: `npm run dev`
2. Login to your account
3. Go to **Dashboard** > **Company** (in sidebar)
4. Try uploading a company logo
5. Image should preview immediately after upload

## ❌ If Something Doesn't Work

**Can't create bucket:**
- Make sure you're in the correct Supabase project
- Check that you have admin permissions

**Upload fails in app:**
- Verify all 4 policies are created
- Check bucket is set to "Public"
- Open browser console (F12) to see error details

**Image doesn't display:**
- Verify the URL in `company_settings` table
- Try opening the URL directly in browser
- Check if file exists in Storage > company-assets > company-logos

## 📸 Screenshots Location

If you need visual guidance, each step is documented in detail in `STORAGE_SETUP_DASHBOARD.md`.

---

**Estimated time:** 5-10 minutes
