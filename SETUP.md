# GetInvoice - Detailed Setup Guide

This guide will walk you through setting up the GetInvoice CRM system from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Common Issues](#common-issues)

## Prerequisites

Before you begin, ensure you have:

- Node.js 20 or higher installed
- npm or yarn package manager
- A Supabase account (free tier works great)
- Docker and Docker Compose (for containerized deployment)
- Git (for version control)

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `getinvoice` (or your preferred name)
   - Database password: (generate a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Get API Credentials

1. Go to Project Settings (gear icon in sidebar)
2. Click on "API" in the left menu
3. Copy the following:
   - Project URL (starts with https://)
   - anon/public key
   - service_role key (keep this secret!)

### Step 3: Set Up Database Schema

1. In your Supabase dashboard, click on "SQL Editor" in the sidebar
2. Run the main schema:
   - Click "New Query"
   - Open the file `supabase/schema.sql` from this project
   - Copy and paste the entire contents into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for the script to complete (you should see "Success" message)
3. Run the currency schema:
   - Click "New Query" again
   - Open the file `supabase/schema_currency.sql` from this project
   - Copy and paste the contents into the SQL editor
   - Click "Run"
4. Run the payments schema (for Stripe integration):
   - Click "New Query"
   - Open the file `supabase/schema_payments.sql` from this project
   - Copy and paste the contents into the SQL editor
   - Click "Run"
5. Verify tables were created:
   - Go to "Table Editor" in the sidebar
   - You should see: profiles, customers, invoices, invoice_items, subscription_plans, currency_settings, payments, company_settings

### Step 4: Set Up Storage for Company Logos

1. In your Supabase dashboard, click on "Storage" in the sidebar
2. Click "Create a new bucket"
3. Enter bucket details:
   - Name: `company-assets`
   - Public bucket: **Yes** (check this box)
   - File size limit: 2MB (recommended)
   - Allowed MIME types: `image/*`
4. Click "Create bucket"
5. Set up storage policies:
   - Go to "SQL Editor" in the sidebar
   - Open the file `supabase/storage_setup.sql` from this project
   - Copy and paste the contents into the SQL editor
   - Click "Run" to create the storage policies

**Note:** The storage bucket is used for company logos that appear on invoices. Making it public allows invoice PDFs to load the logos properly.

### Step 5: Enable Email Authentication

1. Go to Authentication > Providers
2. Make sure "Email" is enabled
3. Configure email templates if desired:
   - Go to Authentication > Email Templates
   - Customize confirmation, password reset emails

### Step 6: Configure Site URL (Important!)

1. Go to Authentication > URL Configuration
2. Add your site URLs:
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. Add redirect URLs:
   - `http://localhost:3000/**` (for development)
   - `https://yourdomain.com/**` (for production)

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd getinvoice

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (from Step 2 above)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to version control!

### Step 3: Run Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:3000

### Step 4: Create Your First Account

1. Open http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in your details
4. Choose a subscription plan (start with Free)
5. Check your email for confirmation link
6. Click the confirmation link
7. Log in with your credentials

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

1. Create a `.env` file in the root directory (similar to `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Build and run:

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop the container
docker-compose down
```

3. Access the application at http://localhost:3000

### Option 2: Using Docker Directly

```bash
# Build the image
docker build -t getinvoice:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --name getinvoice \
  getinvoice:latest

# Check logs
docker logs -f getinvoice

# Stop the container
docker stop getinvoice
docker rm getinvoice
```

## Production Deployment

### Deployment Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure Supabase redirect URLs for your domain
- [ ] Review and update email templates in Supabase
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Test authentication flow end-to-end
- [ ] Test invoice generation and PDF export
- [ ] Set up rate limiting (if needed)

### Deploy to Popular Platforms

#### Vercel (Easiest)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. Click "Deploy"
7. Update Supabase redirect URLs with your Vercel domain

#### Netlify

1. Push your code to GitHub
2. Go to https://netlify.com
3. Click "Add new site"
4. Import your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables in Site Settings
7. Deploy

#### Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables
6. Railway will auto-detect Next.js and deploy

#### DigitalOcean/AWS/GCP (Using Docker)

1. Set up a virtual machine
2. Install Docker and Docker Compose
3. Clone your repository
4. Create `.env` file with production values
5. Run `docker-compose up -d`
6. Set up Nginx reverse proxy with SSL
7. Configure domain DNS

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Common Issues

### Issue: "Invalid API key" error

**Solution**:
- Double-check your environment variables
- Make sure you're using the correct anon key (not service role)
- Verify the Supabase URL is correct

### Issue: Authentication not working

**Solution**:
- Check Supabase Auth is enabled
- Verify redirect URLs are configured correctly
- Clear browser cache and cookies
- Check email confirmation settings

### Issue: Database tables not found

**Solution**:
- Run the schema.sql script in Supabase SQL Editor
- Verify tables exist in Table Editor
- Check RLS policies are enabled

### Issue: Can't create customers/invoices

**Solution**:
- Verify you're logged in
- Check RLS policies allow your user to insert
- Open browser console for detailed error messages
- Verify database schema matches code expectations

### Issue: PDF generation fails

**Solution**:
- Check browser console for errors
- Verify invoice data loads correctly
- Ensure jsPDF dependencies are installed
- Try in a different browser

### Issue: Docker container won't start

**Solution**:
- Check Docker logs: `docker-compose logs app`
- Verify environment variables are set correctly
- Ensure port 3000 is not already in use
- Try rebuilding: `docker-compose build --no-cache`

### Issue: Slow performance

**Solution**:
- Check database indexes are created (schema.sql)
- Monitor Supabase dashboard for query performance
- Consider upgrading Supabase plan for better performance
- Implement caching for frequently accessed data

## Next Steps

After successful setup:

1. Customize the branding (logo, colors)
2. Set up email service for invoice sending
3. Configure backup strategy
4. Set up monitoring (Sentry, LogRocket)
5. Add custom invoice templates
6. Implement payment gateway integration

## Getting Help

- Check the main README.md for feature documentation
- Review Supabase documentation: https://supabase.com/docs
- Open an issue on GitHub
- Contact support

## Security Best Practices

1. **Never expose service role key**: Only use it server-side
2. **Use HTTPS in production**: Always encrypt traffic
3. **Keep dependencies updated**: Run `npm audit` regularly
4. **Enable 2FA**: For your Supabase account
5. **Regular backups**: Set up automated database backups
6. **Monitor logs**: Watch for suspicious activity
7. **Rate limiting**: Implement API rate limiting in production
8. **CSP headers**: Configure Content Security Policy

Happy building! 🚀
