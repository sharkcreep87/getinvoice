# WhatsApp Bot Initialization Debugging Guide

## Issue
When trying to initialize the WhatsApp bot, you're getting the error:
```
Connection Error
No bot session found. Please initialize first.
```

## Root Cause Analysis

The error occurs because the QR code fetch endpoint (`/api/whatsapp-bot/qr`) is being called before the bot session is created in the database. Here's the flow:

1. User clicks "Generate QR Code"
2. Frontend calls `/api/whatsapp-bot/init` (POST)
3. Init endpoint calls `botClient.initialize()`
4. Bot client starts initializing (async process)
5. Frontend waits 2 seconds then calls `/api/whatsapp-bot/qr` (GET)
6. QR endpoint tries to fetch session from database
7. **ERROR**: Session doesn't exist yet because bot initialization is still in progress

## Recent Changes Made

### 1. Added Better Error Handling & Logging
**File**: `src/lib/whatsapp-bot/client.ts`

Added detailed logging to the `updateSessionStatus` method:
- Logs when upserting session
- Logs success with data
- Throws errors instead of silently catching them
- Added `.select()` to upsert to return the created/updated record

### 2. Fixed TypeScript Errors
Fixed all Supabase type inference issues across:
- `/api/whatsapp-bot/disconnect/route.ts`
- `/api/whatsapp-bot/init/route.ts`
- `/api/whatsapp-bot/qr/route.ts`
- `/api/whatsapp-bot/status/route.ts`
- `/lib/whatsapp-bot/client.ts`

## How to Debug

### Step 1: Check Server Logs
When you click "Generate QR Code", watch the terminal where `npm run dev` is running. You should see:

```
[Bot <user-id>] Upserting session with status: connecting
[Bot <user-id>] Session updated successfully: [...]
[Bot <user-id>] QR Code received
[Bot <user-id>] Upserting session with status: qr_ready
```

If you see errors, they will indicate what's failing.

### Step 2: Check Database
Verify the session is being created in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Table Editor → `whatsapp_bot_sessions`
3. Check if a row exists for your user_id
4. Check the `status` column value

### Step 3: Check RLS Policies
The database has Row Level Security (RLS) enabled. Verify the policies allow:
- INSERT: Users can create their own sessions
- SELECT: Users can read their own sessions
- UPDATE: Users can update their own sessions

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM whatsapp_bot_sessions WHERE user_id = '<your-user-id>';
```

## Potential Issues & Solutions

### Issue 1: Session Creation Fails Silently
**Symptom**: No logs appear, session not in database
**Solution**: Check the updated `updateSessionStatus` method now throws errors

### Issue 2: RLS Policy Blocks Insert
**Symptom**: Error in logs about permission denied
**Solution**: Check RLS policies in Supabase dashboard

### Issue 3: Timing Issue
**Symptom**: Session created but QR fetch happens too early
**Solution**: The frontend waits 2 seconds, but initialization might take longer

**Fix**: Increase wait time in `qr-code-display.tsx` line 77:
```typescript
// Change from 2000ms to 5000ms
setTimeout(() => fetchQRCode(), 5000)
```

### Issue 4: WhatsApp Web.js Initialization Fails
**Symptom**: Logs show "Initialization error"
**Solution**: Check if Puppeteer dependencies are installed

Run:
```bash
npm install
```

For macOS, you might need:
```bash
brew install chromium
```

### Issue 5: Subscription Check Fails
**Symptom**: Error "Active subscription required"
**Solution**: Make sure your user profile has `subscription_tier` set to something other than 'free'

Update in Supabase:
```sql
UPDATE profiles 
SET subscription_tier = 'pro' 
WHERE id = '<your-user-id>';
```

## Testing the Fix

1. **Restart the dev server**:
   ```bash
   # Kill the current server
   lsof -ti:3000 | xargs kill -9
   
   # Start fresh
   npm run dev
   ```

2. **Clear browser cache** or open in incognito mode

3. **Watch the terminal logs** closely when clicking "Generate QR Code"

4. **Check browser console** for any frontend errors

## Expected Successful Flow

1. Click "Generate QR Code"
2. See "Initializing WhatsApp bot..." loading state
3. Logs show:
   ```
   [Bot xxx] Already initializing... (or) Client already exists
   [Bot xxx] Upserting session with status: connecting
   [Bot xxx] Session updated successfully
   [Bot xxx] QR Code received
   [Bot xxx] Upserting session with status: qr_ready
   ```
4. QR code appears on screen
5. Scan with WhatsApp
6. Status changes to "authenticated" then "ready"
7. Success message: "Bot Connected!"

## Next Steps if Still Failing

1. Share the **exact error logs** from the terminal
2. Share the **browser console errors**
3. Check if the session exists in the database
4. Verify your subscription tier is not 'free'
5. Make sure Puppeteer/Chromium is properly installed

## Quick Fixes to Try

### Fix 1: Ensure Session is Created Before QR Fetch
Edit `src/lib/whatsapp-bot/client.ts` line 80:

```typescript
// Add this right after updateSessionStatus
await this.updateSessionStatus('connecting')
console.log('[Bot] Session created, starting client initialization')
```

### Fix 2: Add Retry Logic to QR Fetch
Edit `src/components/whatsapp-bot/qr-code-display.tsx`:

```typescript
const fetchQRCode = async (retries = 3) => {
  try {
    const response = await fetch('/api/whatsapp-bot/qr')
    const data = await response.json()

    if (!response.ok) {
      if (retries > 0 && data.error?.includes('No bot session found')) {
        // Retry after 2 seconds
        setTimeout(() => fetchQRCode(retries - 1), 2000)
        return
      }
      throw new Error(data.error || 'Failed to fetch QR code')
    }
    // ... rest of the code
  } catch (err: any) {
    setError(err.message)
  }
}
```

## Contact
If the issue persists after trying these solutions, please provide:
1. Full terminal logs from initialization attempt
2. Browser console logs
3. Screenshot of the error
4. Result of database query for your session
