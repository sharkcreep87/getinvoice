#!/bin/bash

# Quick Setup Script for DigitalOcean WhatsApp Bot
# Run this on your DigitalOcean server

set -e  # Exit on error

echo "=================================================="
echo "WhatsApp Bot - DigitalOcean Quick Setup"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "Updating system packages..."
apt-get update -qq

# Install Chromium dependencies
echo ""
echo "Installing Chromium dependencies (this may take a few minutes)..."
apt-get install -y -qq \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
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
    wget \
    xdg-utils \
    > /dev/null 2>&1

echo "✓ Dependencies installed"

# Install Chromium
echo ""
echo "Installing Chromium browser..."
if apt-get install -y -qq chromium-browser > /dev/null 2>&1; then
    echo "✓ Chromium browser installed"
elif apt-get install -y -qq chromium > /dev/null 2>&1; then
    echo "✓ Chromium installed"
else
    echo "⚠ Could not install Chromium, but dependencies are installed"
    echo "  Puppeteer will use its bundled Chromium"
fi

# Check if Node.js is installed
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION is installed"
else
    echo "⚠ Node.js not found"
    echo "  Install Node.js 18+ before continuing"
    echo "  Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "       sudo apt-get install -y nodejs"
fi

# Check if PM2 is installed
echo ""
echo "Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "✓ PM2 is installed"
else
    echo "Installing PM2..."
    npm install -g pm2 > /dev/null 2>&1
    echo "✓ PM2 installed"
fi

# Add swap if needed (for low memory servers)
echo ""
echo "Checking swap space..."
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 1024 ]; then
    echo "Adding 2GB swap space..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile > /dev/null 2>&1
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        echo "✓ Swap added"
    else
        echo "✓ Swap file already exists"
    fi
else
    echo "✓ Sufficient swap space available"
fi

echo ""
echo "=================================================="
echo "✓ Server Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Navigate to your app directory:"
echo "   cd /var/www/your-app"
echo ""
echo "2. Install npm dependencies:"
echo "   npm install"
echo ""
echo "3. Create .env.local with your Supabase credentials:"
echo "   nano .env.local"
echo ""
echo "4. Build the app:"
echo "   npm run build"
echo ""
echo "5. Start with PM2:"
echo "   pm2 start npm --name getinvoice -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "6. Test WhatsApp bot initialization"
echo ""
echo "=================================================="
echo ""
echo "To verify Chromium is working:"
echo "  node -e \"const p = require('puppeteer'); console.log(p.executablePath())\""
echo ""
echo "To monitor the app:"
echo "  pm2 logs getinvoice"
echo ""
echo "=================================================="
