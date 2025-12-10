# Simple Fix for Chromium Dependencies on DigitalOcean

## The Problem
Installing `-dev` packages causes dependency conflicts. You only need the runtime libraries, not development headers.

## Simple Solution

**Run this command on your DigitalOcean server:**

```bash
sudo apt-get update && sudo apt-get install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    libasound2 \
    libappindicator3-1 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    wget \
    xdg-utils \
    ca-certificates
```

Then restart your app:

```bash
pm2 restart getinvoice
```

## One-Line Command

Copy and paste this:

```bash
sudo apt-get update && sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 libcairo2 libcups2 libdrm2 libgbm1 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libasound2 libappindicator3-1 libdbus-1-3 libexpat1 libfontconfig1 wget xdg-utils ca-certificates && pm2 restart getinvoice
```

## Verify

Check the logs:

```bash
pm2 logs getinvoice --lines 50
```

You should see no more library errors.

## If You Still Get Errors

If you see a different missing library error like:
```
error while loading shared libraries: libXXX.so.0: cannot open shared object file
```

Install just that library (without -dev):

```bash
sudo apt-get install -y libXXX-0
pm2 restart getinvoice
```

## Alternative: Install Chromium Browser

The easiest solution is to install the full Chromium browser package, which includes all dependencies:

```bash
sudo apt-get update
sudo apt-get install -y chromium-browser

# Or on some systems:
sudo apt-get install -y chromium

# Restart app
pm2 restart getinvoice
```

This installs everything Chromium needs automatically.

## Summary

**Don't use `-dev` packages.** Use runtime libraries only:

```bash
sudo apt-get install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2
```

**Or just install Chromium:**

```bash
sudo apt-get install -y chromium-browser
```

That's it! 🚀
