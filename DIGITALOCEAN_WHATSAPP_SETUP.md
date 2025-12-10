# WhatsApp Bot on DigitalOcean - Complete Setup Guide

## Issue: "Failed to launch browser process"

This error occurs because Puppeteer/Chromium requires system dependencies that aren't installed on a fresh DigitalOcean droplet.

## Solution: Install Chromium Dependencies

### Step 1: SSH into Your DigitalOcean Server

```bash
ssh root@your-droplet-ip
```

### Step 2: Update System Packages

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 3: Install Chromium Dependencies

**For Ubuntu 20.04/22.04/24.04 or Debian:**

```bash
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils
```

### Step 4: Install Chromium Browser

```bash
sudo apt-get install -y chromium-browser
```

**OR** if chromium-browser is not available:

```bash
sudo apt-get install -y chromium
```

### Step 5: Verify Installation

```bash
# Check Chromium is installed
which chromium-browser || which chromium

# Test Puppeteer
cd /path/to/your/app
node -e "const puppeteer = require('puppeteer'); console.log(puppeteer.executablePath())"
```

Should output a path to Chromium.

### Step 6: Install Node.js Dependencies

```bash
cd /path/to/your/app
npm install
```

### Step 7: Test WhatsApp Bot

```bash
# Start your app
npm run start
# OR
pm2 start npm --name "getinvoice" -- start

# Check logs
pm2 logs getinvoice
```

## Alternative: Use Puppeteer with Bundled Chromium

If the above doesn't work, you can use Puppeteer's bundled Chromium:

### Step 1: Install Full Puppeteer

```bash
cd /path/to/your/app

# Remove puppeteer-core
npm uninstall puppeteer-core

# Install full puppeteer (includes Chromium)
npm install puppeteer
```

### Step 2: Update whatsapp-web.js

```bash
npm install whatsapp-web.js@latest
```

### Step 3: Restart Application

```bash
pm2 restart all
```

## Troubleshooting

### Error: "libgbm.so.1: cannot open shared object file"

**Solution:**
```bash
sudo apt-get install -y libgbm-dev
```

### Error: "libnss3.so: cannot open shared object file"

**Solution:**
```bash
sudo apt-get install -y libnss3 libnss3-dev
```

### Error: "Failed to launch the browser process"

**Solution 1: Install all dependencies**
```bash
# Run the comprehensive install from Step 3 above
sudo apt-get install -y ca-certificates fonts-liberation ...
```

**Solution 2: Use system Chromium**
```bash
# Install Chromium
sudo apt-get install -y chromium-browser

# Update Puppeteer config to use system Chromium
# In your code, add executablePath option
```

### Error: "Running as root without --no-sandbox is not supported"

**Solution:** Add `--no-sandbox` flag (already included in the code)

The client.ts file already has this:
```typescript
puppeteer: {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // ... other args
  ],
}
```

### Error: Out of Memory

**Solution:** Increase server memory or add swap

```bash
# Add 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Complete Setup Script for DigitalOcean

Save this as `setup-digitalocean.sh` on your server:

```bash
#!/bin/bash

echo "=================================================="
echo "Setting up WhatsApp Bot on DigitalOcean"
echo "=================================================="
echo ""

# Update system
echo "Step 1: Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (if not already installed)
echo ""
echo "Step 2: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install Chromium dependencies
echo ""
echo "Step 3: Installing Chromium dependencies..."
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Install Chromium
echo ""
echo "Step 4: Installing Chromium..."
sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium

# Install PM2 (if not already installed)
echo ""
echo "Step 5: Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi

# Install app dependencies
echo ""
echo "Step 6: Installing app dependencies..."
cd /var/www/getinvoice  # Adjust path as needed
npm install

# Build app
echo ""
echo "Step 7: Building app..."
npm run build

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Set up environment variables in .env.local"
echo "2. Start the app: pm2 start npm --name getinvoice -- start"
echo "3. Save PM2 config: pm2 save"
echo "4. Set PM2 to start on boot: pm2 startup"
echo ""
echo "=================================================="
```

## Environment Variables on DigitalOcean

Create `.env.local` on your server:

```bash
cd /path/to/your/app
nano .env.local
```

Add:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Save with Ctrl+X, Y, Enter.

## Starting the App with PM2

```bash
# Start app
pm2 start npm --name "getinvoice" -- start

# View logs
pm2 logs getinvoice

# Restart
pm2 restart getinvoice

# Stop
pm2 stop getinvoice

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

## Nginx Configuration (Optional)

If using Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Memory Requirements

**Minimum:**
- 2GB RAM (for running Chromium)
- 2GB Swap (recommended)

**Recommended:**
- 4GB RAM
- 10GB disk space

## Monitoring

Check if WhatsApp bot is working:

```bash
# Check Chromium processes
ps aux | grep chromium

# Check app logs
pm2 logs getinvoice

# Check memory usage
free -h

# Check disk space
df -h
```

## Summary

1. ✅ Install Chromium dependencies
2. ✅ Install Chromium browser
3. ✅ Install Node.js and npm packages
4. ✅ Set up environment variables
5. ✅ Build and start the app
6. ✅ Monitor with PM2

The WhatsApp bot should now work on DigitalOcean! 🚀
