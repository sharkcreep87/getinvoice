# Quick Deployment Guide

Deploy your CRM system to the cloud in minutes!

## Option 1: Deploy to Vercel (Easiest - 10 minutes)

Vercel offers free hosting for Next.js applications with automatic deployments.

### Step 1: Prepare Accounts (5 minutes)

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub (recommended) or email
   - Free tier is perfect for testing

2. **Create a Supabase Account**
   - Go to https://supabase.com
   - Sign up (free tier available)
   - Create a new project
   - Note: Project creation takes 2-3 minutes

3. **Create a Stripe Account** (Optional for testing)
   - Go to https://stripe.com
   - Sign up
   - Get test API keys (Dashboard → Developers → API Keys)

### Step 2: Deploy to Vercel (2 minutes)

#### Method A: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project directory
cd /path/to/getinvoice

# Deploy
vercel

# Follow prompts:
# - Link to Vercel account
# - Choose project name
# - Accept default settings
```

#### Method B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect Next.js
4. Click "Deploy"

### Step 3: Set Up Supabase (3 minutes)

1. In your Supabase project dashboard:
   - Go to **SQL Editor**
   - Click **New Query**
   - Copy and paste contents of `supabase/schema.sql`
   - Click **Run**
   - Then run `supabase/schema_payments.sql`

2. Get your API credentials:
   - Go to **Project Settings** → **API**
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` key (click to reveal)

### Step 4: Configure Environment Variables (2 minutes)

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional - for payment testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

3. Click **Save**
4. Go to **Deployments** → Click **⋯** on latest deployment → **Redeploy**

### Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Click **Sign Up** and create an account
3. Check your email for verification
4. Log in and test features:
   - Add customers
   - Create invoices
   - Generate PDFs
   - Try subscription (if Stripe configured)

## Option 2: Deploy to Netlify

1. Go to https://netlify.com
2. Click **Add new site** → **Import existing project**
3. Connect your Git repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables (same as Vercel)
6. Click **Deploy**

## Option 3: Deploy to Railway

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway auto-detects Next.js
5. Add environment variables in **Variables** tab
6. Deploy automatically

## Option 4: Deploy with Docker (Any Cloud Provider)

### Using Docker Compose (DigitalOcean, AWS, GCP, etc.)

```bash
# On your server
git clone <your-repo>
cd getinvoice

# Create .env file with your credentials
nano .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### Environment File (.env)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Quick Test Without Database (Limited)

If you want to quickly test the UI without setting up Supabase:

1. Comment out auth checks in `src/app/dashboard/layout.tsx`
2. Deploy to Vercel
3. You can see the UI but features won't work

**Not recommended** - better to spend 5 minutes setting up Supabase properly.

## Post-Deployment Checklist

After successful deployment:

- [ ] Test user registration and login
- [ ] Verify email confirmation works
- [ ] Test customer creation
- [ ] Test invoice generation and PDF export
- [ ] Test subscription upgrade (if using Stripe)
- [ ] Set up custom domain (optional)
- [ ] Configure Stripe webhooks with production URL
- [ ] Enable production mode in Stripe
- [ ] Set up monitoring (Vercel Analytics, Sentry, etc.)

## Troubleshooting

### Build Fails

**Error**: `Module not found`
- Run `npm install` locally first
- Ensure `package.json` is committed

**Error**: `Environment variable not found`
- Check all required variables are set in Vercel dashboard
- Redeploy after adding variables

### Database Connection Fails

**Error**: `Failed to load subscription`
- Verify Supabase URL is correct
- Check API keys are valid
- Ensure database schema is applied
- Check RLS policies are enabled

### Authentication Not Working

**Error**: `Invalid login credentials`
- Check Supabase Auth is enabled
- Verify email confirmation settings
- Check redirect URLs in Supabase dashboard

### Stripe Webhooks Not Working

**Error**: `Webhook signature verification failed`
- Update webhook URL in Stripe dashboard
- Use your production URL: `https://your-app.vercel.app/api/webhooks/stripe`
- Copy the new webhook secret
- Update `STRIPE_WEBHOOK_SECRET` in Vercel
- Redeploy

## Cost Breakdown

### Free Tier (Perfect for Testing)

- **Vercel**: Free (100GB bandwidth, unlimited deployments)
- **Supabase**: Free (500MB database, 50,000 monthly active users)
- **Stripe**: Free (pay only transaction fees: 2.9% + 30¢)

**Total**: $0/month for testing and small usage

### Paid Tier (For Production)

- **Vercel Pro**: $20/month (1TB bandwidth, advanced features)
- **Supabase Pro**: $25/month (8GB database, 100,000 MAU)
- **Stripe**: Transaction fees only

**Total**: ~$45/month + transaction fees

## One-Click Deploy Button

Add this to your README for instant deployments:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/getinvoice)

## Getting Help

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Next.js Docs: https://nextjs.org/docs

## Next Steps

After successful deployment:

1. **Customize branding**: Update logo, colors, company name
2. **Set up custom domain**: Add your domain in Vercel settings
3. **Enable monitoring**: Add Vercel Analytics or Sentry
4. **Configure email**: Set up custom email templates in Supabase
5. **Add more features**: Based on your business needs
6. **Go live**: Switch Stripe to live mode when ready

---

**Estimated Total Setup Time**: 15-20 minutes
**Monthly Cost**: $0 (free tier) to $45 (production)

Happy deploying! 🚀
