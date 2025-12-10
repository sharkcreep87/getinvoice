# Quick Fix for libatk-1.0.so.0 Error on DigitalOcean

## Error
```
error while loading shared libraries: libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

## Quick Fix

**Run this on your DigitalOcean server:**

```bash
sudo apt-get update
sudo apt-get install -y libatk1.0-0 libatk1.0-dev
```

Then restart your app:

```bash
pm2 restart getinvoice
```

## If That Doesn't Work

Install ALL missing libraries at once:

```bash
sudo apt-get update && sudo apt-get install -y \
    libatk1.0-0 \
    libatk1.0-dev \
    libatk-bridge2.0-0 \
    libatk-bridge2.0-dev \
    libatspi2.0-0 \
    libatspi2.0-dev \
    libcups2 \
    libcups2-dev \
    libdrm2 \
    libdrm-dev \
    libgbm1 \
    libgbm-dev \
    libgtk-3-0 \
    libgtk-3-dev \
    libnspr4 \
    libnspr4-dev \
    libnss3 \
    libnss3-dev \
    libxcomposite1 \
    libxcomposite-dev \
    libxdamage1 \
    libxdamage-dev \
    libxfixes3 \
    libxfixes-dev \
    libxkbcommon0 \
    libxkbcommon-dev \
    libxrandr2 \
    libxrandr-dev
```

Then restart:

```bash
pm2 restart getinvoice
pm2 logs getinvoice
```

## Complete One-Line Fix

Copy and paste this entire command:

```bash
sudo apt-get update && sudo apt-get install -y libatk1.0-0 libatk1.0-dev libatk-bridge2.0-0 libatk-bridge2.0-dev libatspi2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 && pm2 restart getinvoice
```

## Verify It Works

After installing, check the logs:

```bash
pm2 logs getinvoice --lines 50
```

You should see:
- No more "error while loading shared libraries"
- WhatsApp bot initialization starting
- QR code generation working

## Alternative: Use System Chromium

If Puppeteer's bundled Chromium keeps having issues, use the system Chromium:

```bash
# Install system Chromium
sudo apt-get install -y chromium-browser

# Or on some systems:
sudo apt-get install -y chromium
```

The code already uses `--no-sandbox` flags, so it should work with system Chromium.

## Test

After fixing, test the WhatsApp bot:

1. Open your app in browser
2. Navigate to WhatsApp Bot page
3. Click "Generate QR Code"
4. Watch PM2 logs: `pm2 logs getinvoice`
5. QR code should appear within 30-60 seconds

## Summary

The error is caused by missing ATK library. Fix with:

```bash
sudo apt-get install -y libatk1.0-0 libatk1.0-dev
pm2 restart getinvoice
```

That's it! 🚀
