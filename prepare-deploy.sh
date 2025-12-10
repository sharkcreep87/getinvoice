#!/bin/bash

# DigitalOcean Deployment Script
# This script prepares the app for deployment to DigitalOcean

echo "=================================================="
echo "Preparing for DigitalOcean Deployment"
echo "=================================================="
echo ""

# Step 1: Clean build artifacts
echo "Step 1: Cleaning build artifacts..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
echo "   ✓ Cleaned .next, out, and cache directories"

# Step 2: Verify dependencies
echo ""
echo "Step 2: Verifying dependencies..."
if npm list lucide-react > /dev/null 2>&1; then
    echo "   ✓ lucide-react is installed"
else
    echo "   ✗ lucide-react is missing"
    echo "   Installing..."
    npm install lucide-react
fi

# Step 3: Run type check
echo ""
echo "Step 3: Running type check..."
if npm run type-check > /dev/null 2>&1; then
    echo "   ✓ Type check passed"
else
    echo "   ✗ Type check failed"
    echo "   Please fix TypeScript errors before deploying"
    exit 1
fi

# Step 4: Build production bundle
echo ""
echo "Step 4: Building production bundle..."
if npm run build; then
    echo "   ✓ Build successful"
else
    echo "   ✗ Build failed"
    echo "   Please fix build errors before deploying"
    exit 1
fi

# Step 5: Test production build locally
echo ""
echo "Step 5: Testing production build..."
echo "   Starting production server on port 3000..."
echo "   Press Ctrl+C after verifying icons load correctly"
echo ""
npm run start

echo ""
echo "=================================================="
echo "Deployment Preparation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. If icons loaded correctly in production mode:"
echo "   git add ."
echo "   git commit -m 'fix: rebuild with lucide-react icons'"
echo "   git push origin main"
echo ""
echo "2. On DigitalOcean server, run:"
echo "   cd /path/to/app"
echo "   git pull origin main"
echo "   rm -rf .next node_modules/.cache"
echo "   npm install"
echo "   npm run build"
echo "   pm2 restart all"
echo ""
echo "3. Clear browser cache and hard refresh"
echo "=================================================="
