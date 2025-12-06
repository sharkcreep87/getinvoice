# How to Apply the Subscription Plans UPDATE Policy

This guide shows you how to apply the database migration that allows admins to update subscription plans.

## 🚀 Quick Method (Using Supabase Dashboard)

This is the **easiest** method:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/yeltmbdzhqvkjbeizelu

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Paste and Run this SQL:**
```sql
CREATE POLICY IF NOT EXISTS "Admins can update subscription plans" ON public.subscription_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

4. **Click "Run"** (or press Ctrl+Enter)

5. **Done!** You should see: "Success. No rows returned"

---

## 🔧 Using Supabase CLI (`supabase db push`)

If you prefer using the CLI:

### Step 1: Get Your Supabase Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Give it a name (e.g., "CLI Access")
4. Copy the token (it won't be shown again!)

### Step 2: Set the Access Token

Add to your `.env.local` file:
```bash
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

**Or** export it temporarily:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

### Step 3: Run the Setup Script

```bash
./setup-supabase-cli.sh
```

**Or** run manually:
```bash
npx supabase link --project-ref yeltmbdzhqvkjbeizelu
npx supabase db push
```

---

## ✅ Verify It Worked

1. Go to your admin settings: `/dashboard/admin/settings`
2. Try to update a subscription plan price
3. Click outside the input field
4. You should see: **"Subscription plan updated successfully"** ✅

If you see this message, the migration was applied successfully!

---

## 🔍 Troubleshooting

### Error: "Access token not provided"
- Make sure you've set `SUPABASE_ACCESS_TOKEN` in your environment
- Try: `echo $SUPABASE_ACCESS_TOKEN` to verify it's set

### Error: "Failed to push migrations"
- Use the Quick Method (Supabase Dashboard) instead
- Or manually run the SQL from `apply_subscription_plans_policy.sql`

### Still not working?
- Check that you're logged in as an admin user
- Verify the policy exists by running in SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'subscription_plans';
```

You should see two policies:
- "Anyone can view subscription plans" (SELECT)
- "Admins can update subscription plans" (UPDATE)
