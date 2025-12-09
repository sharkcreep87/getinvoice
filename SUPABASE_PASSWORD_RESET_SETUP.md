# Supabase Password Reset Setup Guide

## Quick Setup (No Code Changes Needed!)

The forgot password feature is now configured to work automatically without requiring `NEXT_PUBLIC_APP_URL` in your `.env` file. It uses `window.location.origin` to detect your current URL.

## Supabase Dashboard Configuration

You need to configure the redirect URL in your Supabase dashboard:

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### Step 2: Add Redirect URL

In the **Redirect URLs** section, add these URLs:

**For Development:**
```
http://localhost:3000/reset-password
```

**For Production:**
```
https://yourdomain.com/reset-password
```

Replace `yourdomain.com` with your actual production domain.

### Step 3: Configure Site URL (Optional)

Under **Site URL**, you can set:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

### Step 4: Email Templates (Optional Customization)

Go to **Authentication** → **Email Templates** → **Reset Password**

You can customize:
- Email subject
- Email body
- Sender name

The default template works fine, but you can brand it with your company name and colors.

## Testing the Flow

### Local Development
1. Make sure dev server is running: `npm run dev`
2. Go to: http://localhost:3000/login
3. Click "Forgot password?"
4. Enter your email
5. Check your email inbox
6. Click the reset link
7. You'll be redirected to: http://localhost:3000/reset-password
8. Enter your new password
9. Success! You'll be redirected to login

### Production
Same flow, but URLs will use your production domain automatically.

## Important Notes

✅ **No .env changes needed** - The code automatically detects the current URL
✅ **Works in dev and production** - Just add both URLs to Supabase dashboard
✅ **Secure** - Uses Supabase's built-in token-based authentication
✅ **Email verification** - User must have access to their email

## Troubleshooting

### "Invalid redirect URL" error
- Make sure you added the redirect URL to Supabase dashboard
- Check that the URL exactly matches (include `/reset-password`)
- Ensure there are no trailing slashes

### Email not arriving
- Check spam folder
- Verify email is confirmed in your Supabase Auth Users table
- Check Supabase logs for email sending errors
- Ensure SMTP is configured (Supabase provides default SMTP)

### Reset link expired
- Password reset links expire after 1 hour (default)
- Request a new reset link
- You can configure expiration time in Supabase settings

## Email Template Variables

When customizing email templates, you can use these variables:
- `{{ .ConfirmationURL }}` - The password reset link
- `{{ .Token }}` - The reset token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL

## Production Checklist

Before deploying to production:
- ✅ Add production URL to Supabase Redirect URLs
- ✅ Set production Site URL in Supabase
- ✅ Test forgot password flow in production
- ✅ Customize email template with your branding (optional)
- ✅ Verify emails are being delivered
- ✅ Check that reset links work correctly

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Auth Logs
2. Verify redirect URLs are correctly configured
3. Test with a valid email address
4. Check browser console for errors

Your password reset feature is ready to use! 🎉
