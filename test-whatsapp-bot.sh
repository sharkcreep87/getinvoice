#!/bin/bash

# WhatsApp Bot Initialization Test Script
# This script helps debug the bot initialization process

echo "======================================"
echo "WhatsApp Bot Initialization Test"
echo "======================================"
echo ""

# Check if dev server is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running on port 3000"
else
    echo "❌ Dev server is NOT running"
    echo "   Please run: npm run dev"
    exit 1
fi

echo ""
echo "Testing bot initialization..."
echo ""

# Get the auth token (you'll need to replace this with actual token from browser)
echo "To test the API endpoints, you need to:"
echo "1. Open your browser"
echo "2. Open DevTools (F12)"
echo "3. Go to Application/Storage → Cookies"
echo "4. Copy the value of the Supabase auth cookie"
echo ""
echo "Then run these commands in your terminal:"
echo ""
echo "# Test init endpoint"
echo 'curl -X POST http://localhost:3000/api/whatsapp-bot/init \\'
echo '  -H "Cookie: <your-auth-cookie>" \\'
echo '  -v'
echo ""
echo "# Test QR endpoint"
echo 'curl http://localhost:3000/api/whatsapp-bot/qr \\'
echo '  -H "Cookie: <your-auth-cookie>" \\'
echo '  -v'
echo ""
echo "======================================"
echo "Watch your terminal where 'npm run dev' is running"
echo "You should see detailed logs like:"
echo "  [API] WhatsApp bot init request received"
echo "  [API] User authenticated: <user-id>"
echo "  [Bot <user-id>] Upserting session..."
echo "======================================"
