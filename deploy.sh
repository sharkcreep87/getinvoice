#!/bin/bash

echo "🚀 GetInvoice - Quick Deployment Script"
echo "========================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

echo "📋 Pre-deployment checklist:"
echo "  1. Do you have a Vercel account? (sign up at https://vercel.com)"
echo "  2. Do you have a Supabase project? (create at https://supabase.com)"
echo "  3. Do you have your Supabase API keys?"
echo ""

read -p "Press Enter to continue with deployment, or Ctrl+C to cancel..."

echo ""
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Deploying to Vercel..."
    echo ""

    vercel --prod

    echo ""
    echo "✨ Deployment complete!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Go to your Vercel dashboard: https://vercel.com/dashboard"
    echo "  2. Click on your project"
    echo "  3. Go to Settings → Environment Variables"
    echo "  4. Add your Supabase and Stripe keys"
    echo "  5. Redeploy the application"
    echo ""
    echo "📚 For detailed setup, see DEPLOY.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
