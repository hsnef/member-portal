# Vercel Deployment OAuth Configuration Guide

This guide explains how to configure Google OAuth and Supabase for your Vercel deployment.

## Issue
When signing in with Google on Vercel, the app redirects to `http://localhost:3000` instead of your Vercel URL.

## Your Vercel URL
```
https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/
```

---

## Step 1: Configure Supabase Authentication URLs

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project: `gapvsdrzavjaublwkqfm`

2. **Update Site URL**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to:
     ```
     https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app
     ```

3. **Add Redirect URLs**
   - In **Redirect URLs**, add both:
     ```
     http://localhost:3000/**
     https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/**
     ```

   Note: The `**` wildcard allows all paths under these domains.

4. **Save Changes**

---

## Step 2: Update Google OAuth Console

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project

2. **Update OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click on your existing OAuth 2.0 Client ID (created for HSNEF Portal)

3. **Add Authorized Redirect URIs**

   Your current URIs should include:
   ```
   https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   Keep the above and add:
   ```
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/auth/callback
   ```

   **IMPORTANT**: All Google OAuth callbacks go through Supabase first, then Supabase redirects to your app. So the main redirect URI is the Supabase one, but we add the Vercel URL as well for safety.

4. **Save Changes**

---

## Step 3: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project: `member-portal`

2. **Add/Update Environment Variables**
   - Go to **Settings** → **Environment Variables**

3. **Required Environment Variables**:

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   # App URL (for QR codes and emails)
   NEXT_PUBLIC_APP_URL=https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app

   # Email Configuration (Resend)
   RESEND_API_KEY=<your-resend-key>
   RESEND_FROM_EMAIL=<your-from-email>

   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

   # QR Token Secret (generate a long random string)
   QR_TOKEN_SECRET=<generate-a-secure-random-string>
   ```

4. **Environment Scope**
   - Set all variables for **Production**, **Preview**, and **Development** environments
   - OR set them only for **Production** if you want different values per environment

5. **Redeploy**
   - After adding environment variables, go to **Deployments**
   - Click the three dots on the latest deployment
   - Select **Redeploy**

---

## Step 4: Update Stripe Webhook (if using payments)

If you're using Stripe for payments:

1. **Go to Stripe Dashboard**
   - Visit [dashboard.stripe.com](https://dashboard.stripe.com)
   - Go to **Developers** → **Webhooks**

2. **Add Endpoint**
   - Click **Add endpoint**
   - URL: `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/api/stripe/webhook`
   - Select events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

3. **Copy Webhook Secret**
   - After creating, copy the **Signing secret**
   - Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Test the OAuth Flow

1. **Visit your Vercel URL**:
   ```
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app
   ```

2. **Try Google Sign In**
   - Click "Sign in with Google"
   - Should redirect to Google
   - After approval, should redirect back to your Vercel URL (not localhost)

3. **Try Magic Link**
   - Enter your email
   - Check email for magic link
   - Click link should work from Vercel URL

---

## Troubleshooting

### Still Redirecting to Localhost?

1. **Check Browser Cache**
   - Clear browser cache and cookies
   - Try in incognito/private mode

2. **Verify Supabase Site URL**
   - Double-check the Site URL in Supabase is set to your Vercel URL
   - Make sure there are no trailing slashes

3. **Check Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_APP_URL` is set correctly
   - After changing, redeploy

4. **Check Google OAuth Console**
   - Verify all redirect URIs are added
   - Make sure there are no typos

### "Redirect URI Mismatch" Error

This means Google doesn't recognize the redirect URI:
- Double-check the URI in Google Cloud Console
- Format: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
- Must match exactly (no trailing slashes)

### Email/Magic Link Issues

If magic links aren't working:
1. Check `RESEND_API_KEY` is set in Vercel
2. Verify Supabase redirect URLs include your Vercel domain
3. Check Resend dashboard for delivery status

---

## Important Notes

### Custom Domain Setup (Future)

When you add a custom domain (e.g., `portal.hsnef.org`):

1. Add custom domain in Vercel
2. Update Supabase Site URL to custom domain
3. Add custom domain to Supabase redirect URLs
4. Add custom domain callback to Google OAuth
5. Update `NEXT_PUBLIC_APP_URL` environment variable
6. Update Stripe webhook URL (if using)

### Multiple Environments

For production vs. preview deployments:
- Use different Supabase projects for dev/staging/prod
- Set environment-specific variables in Vercel
- Use Vercel's environment variable scoping

---

## Quick Checklist

- [ ] Supabase Site URL updated to Vercel URL
- [ ] Supabase Redirect URLs includes Vercel URL with `/**` wildcard
- [ ] Google OAuth has Supabase callback URL
- [ ] Vercel environment variables are set (especially `NEXT_PUBLIC_APP_URL`)
- [ ] Redeployed after setting environment variables
- [ ] Tested Google OAuth flow on Vercel URL
- [ ] Tested Magic Link flow on Vercel URL
- [ ] (Optional) Stripe webhook updated with Vercel URL

---

## Getting Your Environment Variable Values

### From `.env.local` (Local Development)
Your local `.env.local` file contains all the values you need to copy to Vercel.

### Generating `QR_TOKEN_SECRET`
If you don't have one, generate a secure random string:
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use an online generator
https://generate-secret.vercel.app/32
```

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs for errors
2. Check browser console for error messages
3. Check Supabase logs (Dashboard → Logs)
4. Verify all URLs match exactly (no trailing slashes, correct protocol https/http)
