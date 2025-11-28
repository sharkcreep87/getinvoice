# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for subscription payments in GetInvoice.

## Table of Contents

1. [Create Stripe Account](#create-stripe-account)
2. [Get API Keys](#get-api-keys)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Set Up Webhook](#set-up-webhook)
5. [Test the Integration](#test-the-integration)
6. [Go Live](#go-live)

## Create Stripe Account

1. Go to https://stripe.com
2. Click "Start now" or "Sign in"
3. Create your account with:
   - Email address
   - Password
   - Business details
4. Complete email verification
5. Fill in your business information

## Get API Keys

### For Development (Test Mode)

1. Log in to your Stripe Dashboard
2. Make sure you're in **Test Mode** (toggle in the left sidebar)
3. Navigate to **Developers** > **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_` - click to reveal)
5. Copy both keys - you'll need them for your `.env.local` file

### For Production (Live Mode)

1. Switch to **Live Mode** in the Stripe Dashboard
2. Navigate to **Developers** > **API keys**
3. You'll see:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_` - click to reveal)
4. Copy both keys for your production environment

## Configure Environment Variables

### Local Development

Create or update your `.env.local` file:

```env
# Stripe Test Keys (for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Production

In your production environment (Vercel, Netlify, etc.), set:

```env
# Stripe Live Keys (for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here
```

## Set Up Webhook

Webhooks allow Stripe to notify your application when events occur (like successful payments).

### For Local Development

#### Option 1: Using Stripe CLI (Recommended)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases/latest
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. The CLI will output a webhook signing secret (starts with `whsec_`)
5. Copy this secret to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`

6. Keep the CLI running while testing payments

#### Option 2: Using ngrok or similar tunneling service

1. Install ngrok: https://ngrok.com/download
2. Start your Next.js app: `npm run dev`
3. In another terminal, expose your local server:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Stripe Dashboard:
   - Go to **Developers** > **Webhooks**
   - Click **Add endpoint**
   - Enter: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **Add endpoint**
6. Click on your new endpoint to reveal the **Signing secret**
7. Copy it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Production

1. Go to Stripe Dashboard > **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select the same events as above:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your production environment variables as `STRIPE_WEBHOOK_SECRET`

## Set Up Database

Run the payments schema SQL to create the payments table:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `supabase/schema_payments.sql`
4. Verify the `payments` table was created in **Table Editor**

## Test the Integration

### Test Payment Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. If using Stripe CLI, start webhook forwarding in another terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Log in to your application at http://localhost:3000

4. Navigate to **Dashboard** > **Subscription**

5. Click **Upgrade** on any paid plan (Basic, Pro, or Enterprise)

6. You'll be redirected to Stripe Checkout

7. Use a test card number:
   - Card number: `4242 4242 4242 4242`
   - Expiration: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

8. Complete the payment

9. You should be redirected to the success page

10. Check your Stripe Dashboard > **Payments** to see the test payment

11. Verify in your Supabase database:
    - `profiles` table: subscription_tier should be updated
    - `payments` table: new payment record should exist

### Test Webhook Events

In your Stripe CLI terminal, you should see events like:

```
✔ Received event checkout.session.completed
✔ Received event customer.subscription.created
✔ Received event invoice.payment_succeeded
```

### Test Subscription Cancellation

1. In your app, go to **Dashboard** > **Subscription**
2. Click **Cancel Subscription**
3. Confirm the cancellation
4. Check Stripe Dashboard to verify the subscription is canceled

## Test Cards

Stripe provides several test cards for different scenarios:

| Scenario | Card Number | Description |
|----------|-------------|-------------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient funds | 4000 0000 0000 9995 | Insufficient funds |
| Expired card | 4000 0000 0000 0069 | Expired card |
| 3D Secure | 4000 0027 6000 3184 | 3D Secure required |

More test cards: https://stripe.com/docs/testing#cards

## Go Live

Before going live with real payments:

### 1. Complete Stripe Account Setup

- Add business details
- Verify your business
- Add bank account for payouts
- Enable your account for live payments

### 2. Update Environment Variables

Replace all test keys with live keys in your production environment:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # from production webhook
```

### 3. Set Up Production Webhook

Follow the [Production Webhook Setup](#for-production) section above

### 4. Test in Production

1. Create a test subscription using real payment details
2. Verify the webhook events are received
3. Check database updates
4. Test cancellation flow
5. Verify refunds work (if applicable)

### 5. Monitor Payments

- Set up email notifications in Stripe Dashboard
- Monitor webhook delivery in Stripe Dashboard > **Developers** > **Webhooks**
- Check logs regularly for any errors

## Pricing Configuration

Current subscription prices are defined in `/src/lib/stripe.ts`:

```typescript
export const SUBSCRIPTION_PRICES = {
  free: 0,
  basic: 1900,    // $19.00 (in cents)
  pro: 4900,      // $49.00 (in cents)
  enterprise: 19900, // $199.00 (in cents)
}
```

To change prices:
1. Update the values in `SUBSCRIPTION_PRICES`
2. Update the corresponding prices in the UI (`src/app/dashboard/subscription/page.tsx`)
3. Restart your application

## Troubleshooting

### Webhook Not Receiving Events

**Problem**: Webhooks aren't being received

**Solutions**:
- Verify webhook URL is correct
- Check webhook secret matches `.env` file
- Ensure your server is publicly accessible (use ngrok for local testing)
- Check Stripe Dashboard > **Developers** > **Webhooks** > **Logs**

### Payment Succeeds But Subscription Not Updated

**Problem**: Payment goes through but user's subscription tier doesn't change

**Solutions**:
- Check webhook logs in Stripe Dashboard
- Verify webhook handler is working: check server logs
- Ensure Supabase service role key is set correctly
- Check `payments` table for error details

### "Invalid API Key" Error

**Problem**: Error about invalid API key

**Solutions**:
- Verify you're using the correct key (test vs live)
- Ensure the key hasn't been revoked
- Check the key matches the mode you're in (test/live)
- Verify environment variables are loaded correctly

### CORS Errors

**Problem**: CORS errors when redirecting to Stripe

**Solutions**:
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Check Stripe Dashboard allowed domains
- Verify redirect URLs in checkout session creation

## Security Best Practices

1. **Never expose secret keys**:
   - Never commit `.env.local` to version control
   - Never use `STRIPE_SECRET_KEY` in client-side code
   - Use `NEXT_PUBLIC_*` prefix only for publishable keys

2. **Verify webhook signatures**:
   - Always verify webhook signatures (already implemented)
   - Keep webhook secret secure

3. **Use HTTPS in production**:
   - Always use HTTPS for production
   - Stripe requires HTTPS for webhooks

4. **Monitor for fraud**:
   - Enable Stripe Radar for fraud detection
   - Monitor unusual payment patterns
   - Set up alerts for failed payments

5. **Handle errors gracefully**:
   - Show user-friendly error messages
   - Log errors for debugging
   - Implement retry logic where appropriate

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test your integration: https://stripe.com/docs/testing

## Next Steps

After setting up Stripe:

1. Customize payment success emails
2. Add payment history to user dashboard
3. Implement proration for mid-cycle upgrades
4. Add tax calculation for different regions
5. Implement invoice generation for payments
6. Set up automated dunning for failed payments

## Useful Links

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Testing Guide: https://stripe.com/docs/testing
- Webhook Documentation: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli
- API Reference: https://stripe.com/docs/api
