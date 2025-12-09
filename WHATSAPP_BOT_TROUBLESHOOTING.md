# WhatsApp Bot Initialization Troubleshooting Guide

## Issue: "Stuck at Initializing WhatsApp bot..."

### What We've Fixed

#### 1. **Added Timeout Protection**
- Bot will now timeout after 60 seconds if initialization hangs
- Prevents indefinite waiting
- Shows clear error message if timeout occurs

#### 2. **Enhanced Logging**
Added detailed console logs at every step:
```
[Bot xxx] Starting initialization...
[Bot xxx] Updating session status to 'connecting'...
[Bot xxx] Session status updated
[Bot xxx] Creating WhatsApp client...
[Bot xxx] WhatsApp client created, setting up event handlers...
[Bot xxx] Setting up event handlers...
[Bot xxx] Initializing WhatsApp client (this may take 30-60 seconds)...
[Bot xxx] Loading: 0% - Launching browser...
[Bot xxx] Loading: 50% - Loading WhatsApp Web...
[Bot xxx] QR Code received
```

#### 3. **Added Loading Progress**
- Now shows Puppeteer loading progress
- Helps identify where initialization gets stuck

### How to Debug

#### Step 1: Check Terminal Logs

When you click "Generate QR Code", watch your terminal where `npm run dev` is running.

**Expected logs:**
```bash
[API] WhatsApp bot init request received
[API] User authenticated: <user-id>
[API] Subscription check passed - tier: pro
[API] Creating bot instance...
[API] Bot instance created, starting initialization...
[Bot <user-id>] Starting initialization...
[Bot <user-id>] Updating session status to 'connecting'...
[Bot <user-id>] Session status updated
[Bot <user-id>] Creating WhatsApp client...
[Bot <user-id>] WhatsApp client created, setting up event handlers...
[Bot <user-id>] Setting up event handlers...
[Bot <user-id>] Initializing WhatsApp client (this may take 30-60 seconds)...
[Bot <user-id>] Loading: 0% - Launching browser...
[Bot <user-id>] QR Code received
```

#### Step 2: Identify Where It Stops

If logs stop at a specific point, that tells us what's failing:

**Stops at "Starting initialization":**
- Issue with database connection
- Check `.env.local` has correct Supabase credentials

**Stops at "Creating WhatsApp client":**
- Issue with file permissions
- Check `.wwebjs_auth` directory can be created
- Run: `ls -la .wwebjs_auth`

**Stops at "Initializing WhatsApp client":**
- Puppeteer/Chromium issue
- Most common problem
- See solutions below

**Timeout after 60 seconds:**
- Chromium failed to launch
- Network issue
- See solutions below

### Common Issues & Solutions

#### Issue 1: Chromium Not Launching

**Symptoms:**
- Logs stop at "Initializing WhatsApp client"
- Timeout after 60 seconds
- No QR code appears

**Solutions:**

1. **Reinstall WhatsApp Web.js and Puppeteer:**
   ```bash
   npm uninstall whatsapp-web.js
   npm install whatsapp-web.js@latest
   ```

2. **Clear old session data:**
   ```bash
   rm -rf .wwebjs_auth .wwebjs_cache
   ```

3. **Check Chromium is installed:**
   ```bash
   node -e "const puppeteer = require('puppeteer'); console.log(puppeteer.executablePath());"
   ```
   Should show a path to Chromium.

4. **On macOS, allow Chromium to run:**
   ```bash
   # Find Chromium path from step 3, then:
   xattr -cr /path/to/Chromium.app
   ```

#### Issue 2: Permission Denied

**Symptoms:**
- Error: "EACCES: permission denied"
- Can't create `.wwebjs_auth` directory

**Solution:**
```bash
# Fix permissions
chmod 755 .
mkdir -p .wwebjs_auth
chmod 755 .wwebjs_auth
```

#### Issue 3: Port Already in Use

**Symptoms:**
- Error: "Port 3000 is already in use"
- Multiple dev servers running

**Solution:**
```bash
# Kill existing dev servers
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

#### Issue 4: Database Connection Issues

**Symptoms:**
- Logs show "Failed to update session"
- Error connecting to Supabase

**Solution:**
1. Check `.env.local` has correct values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

2. Test database connection:
   ```bash
   # In browser console on your app
   const { createClient } = require('@supabase/supabase-js')
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   await supabase.from('profiles').select('*').limit(1)
   ```

#### Issue 5: Subscription Tier Not Set

**Symptoms:**
- Error: "Active subscription required"
- Logs show "Subscription check failed - tier: free"

**Solution:**
```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET subscription_tier = 'pro' 
WHERE email = 'your-email@example.com';
```

### Testing the Fix

1. **Restart dev server:**
   ```bash
   # Kill existing server
   lsof -ti:3000 | xargs kill -9
   
   # Start fresh
   npm run dev
   ```

2. **Clear browser cache:**
   - Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Try initializing again:**
   - Navigate to WhatsApp Bot page
   - Click "Generate QR Code"
   - Watch terminal logs closely

4. **Expected timeline:**
   - 0-5s: Creating client
   - 5-30s: Launching Chromium
   - 30-45s: Loading WhatsApp Web
   - 45-60s: QR code appears

### If Still Stuck

#### Get Detailed Error Info

Add this to your code temporarily:

```typescript
// In src/lib/whatsapp-bot/client.ts, line 108
try {
  await Promise.race([initPromise, timeoutPromise])
} catch (error) {
  console.error('DETAILED ERROR:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    cause: error.cause
  })
  throw error
}
```

#### Check System Resources

```bash
# Check available memory
top -l 1 | grep PhysMem

# Check disk space
df -h

# Check if Chromium process is running
ps aux | grep -i chromium
```

#### Last Resort: Use Different Approach

If Puppeteer continues to fail, consider:

1. **Use WhatsApp Business API** (official, paid)
2. **Use third-party service** (Twilio, MessageBird)
3. **Run bot on a VPS** instead of locally

### Quick Checklist

Before asking for help, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] Terminal shows detailed logs
- [ ] Chromium is installed (check with node command above)
- [ ] `.env.local` has correct Supabase credentials
- [ ] Subscription tier is not 'free'
- [ ] No permission errors in terminal
- [ ] Tried clearing `.wwebjs_auth` directory
- [ ] Tried restarting dev server
- [ ] Waited at least 60 seconds

### Summary

The bot initialization now has:
- ✅ 60-second timeout
- ✅ Detailed logging at every step
- ✅ Loading progress indicators
- ✅ Better error messages
- ✅ Automatic cleanup on failure

Watch the terminal logs to see exactly where it's getting stuck, then use the solutions above!
