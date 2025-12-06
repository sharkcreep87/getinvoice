#!/bin/bash

# Setup Supabase CLI for database migrations
# This script helps you configure Supabase CLI to use db push

echo "🔧 Setting up Supabase CLI..."
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not found in environment"
    echo ""
    echo "To fix this, follow these steps:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate New Token'"
    echo "3. Copy the token"
    echo "4. Add to your .env.local file:"
    echo "   SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
    echo "5. Then run: source .env.local"
    echo "6. Or export it: export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
    echo "Then run this script again, or run directly:"
    echo "   npx supabase link --project-ref yeltmbdzhqvkjbeizelu"
    echo "   npx supabase db push"
    exit 1
fi

echo "✅ SUPABASE_ACCESS_TOKEN found"
echo ""

# Link the project
echo "🔗 Linking Supabase project..."
npx supabase link --project-ref yeltmbdzhqvkjbeizelu

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Project linked successfully!"
    echo ""
    echo "📤 Pushing database migrations..."
    npx supabase db push

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration applied successfully!"
        echo ""
        echo "🎉 You can now update subscription plans in the admin settings!"
    else
        echo ""
        echo "❌ Failed to push migrations"
        echo "You can manually apply the SQL in apply_subscription_plans_policy.sql"
    fi
else
    echo ""
    echo "❌ Failed to link project"
    echo "Please check your SUPABASE_ACCESS_TOKEN"
fi
