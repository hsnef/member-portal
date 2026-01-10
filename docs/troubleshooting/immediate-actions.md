# ⚡ Immediate Actions - Get Dev Environment Working

Quick checklist to fix OAuth redirects on your dev Vercel deployment.

---

## 🎯 Goal
Fix Google OAuth redirect issue on:
`https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app`

---

## ✅ Step 1: Update Supabase (5 minutes)

1. Go to https://app.supabase.com
2. Select project: `gapvsdrzavjaublwkqfm`
3. Navigate to: **Authentication** → **URL Configuration**

4. **Set Site URL**:
   ```
   https://portal.hsnef.org
   ```

5. **In "Redirect URLs" section, add ALL these** (keep localhost):
   ```
   http://localhost:3000/**
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/**
   https://portal.hsnef.org/**
   ```

   *Note: Add your Project 2 staging URL later when you know it*

6. Click **Save**

---

## ✅ Step 2: Update Google OAuth Console (3 minutes)

1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

5. **In "Authorized redirect URIs", add ALL these**:
   ```
   https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/auth/callback
   https://portal.hsnef.org/auth/callback
   ```

6. Click **Save**

---

## ✅ Step 3: Set Vercel Environment Variables (10 minutes)

1. Go to https://vercel.com/dashboard
2. Select your dev project (the one connected to `dev` branch)
3. Navigate to: **Settings** → **Environment Variables**

4. **Add these variables** (copy values from your local `.env.local`):

### Critical Variables (Required)

```bash
NEXT_PUBLIC_APP_URL
```
**Value**: `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app`
**Environments**: ☑ Production, ☑ Preview, ☑ Development

```bash
NEXT_PUBLIC_SUPABASE_URL
```
**Value**: `https://gapvsdrzavjaublwkqfm.supabase.co`
**Environments**: ☑ Production, ☑ Preview, ☑ Development

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Value**: (from your .env.local)
**Environments**: ☑ Production, ☑ Preview, ☑ Development

```bash
SUPABASE_SERVICE_ROLE_KEY
```
**Value**: (from your .env.local)
**Environments**: ☑ Production, ☑ Preview, ☑ Development

### Email Variables (Required for magic links)

```bash
RESEND_API_KEY
```
**Value**: (from your .env.local)

```bash
RESEND_FROM_EMAIL
```
**Value**: (from your .env.local)

### Stripe Variables (Required for payments)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
**Value**: Use TEST mode key from Stripe dashboard

```bash
STRIPE_SECRET_KEY
```
**Value**: Use TEST mode key from Stripe dashboard

```bash
STRIPE_WEBHOOK_SECRET
```
**Value**: Create new webhook for dev URL first (see below)

### Security Variables

```bash
QR_TOKEN_SECRET
```
**Value**: Generate a secure random string (see below)

### Optional Variables

```bash
DATABASE_URL
```
**Value**: (from your .env.local, if you need it)

---

## 🔐 Generate QR_TOKEN_SECRET

If you don't have one, run this in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use: https://generate-secret.vercel.app/32

---

## 📍 Create Stripe Webhook for Dev Environment

1. Go to https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle in top right)
3. Navigate to: **Developers** → **Webhooks**
4. Click **Add endpoint**

5. **Endpoint URL**:
   ```
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/api/stripe/webhook
   ```

6. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

7. Click **Add endpoint**

8. **Copy the Signing Secret** (starts with `whsec_`)
   - Add this to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## ✅ Step 4: Redeploy on Vercel

After adding all environment variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **•••** (three dots)
4. Click **Redeploy**

Wait for deployment to complete (~2-3 minutes)

---

## ✅ Step 5: Test Everything

### Test Google OAuth

1. Visit: `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app`
2. Click **Sign in with Google**
3. Select your Google account
4. Should redirect back to the Vercel URL (NOT localhost!)
5. Should see admin dashboard

**If it works:** ✅ OAuth is configured correctly!

**If it still goes to localhost:**
- Clear browser cache and cookies
- Try in incognito/private mode
- Double-check `NEXT_PUBLIC_APP_URL` in Vercel env vars
- Wait a few minutes (DNS/cache propagation)

### Test Magic Link

1. Click **Sign in with Email** (or register)
2. Enter your email
3. Check your email inbox
4. Click the magic link
5. Should redirect to Vercel URL (not localhost)

### Test Member Portal Features

Once logged in:
- View member dashboard
- Check QR code displays
- Try creating a booking/request
- Verify all pages load correctly

---

## 🐛 Troubleshooting

### "Redirect URI mismatch" Error

**Cause**: Google OAuth doesn't recognize the redirect URI

**Fix**:
1. Verify you added the Supabase callback URL to Google OAuth Console
2. Format: `https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback`
3. No trailing slashes!
4. Save and wait 5 minutes for Google to update

### Still Redirecting to Localhost

**Cause**: `NEXT_PUBLIC_APP_URL` not set or not rebuilt

**Fix**:
1. Check Vercel env vars has `NEXT_PUBLIC_APP_URL` set correctly
2. Redeploy the app (env vars only apply on rebuild)
3. Clear browser cache
4. Try incognito mode

### Magic Links Not Working

**Cause**: Email not configured or Supabase redirects wrong

**Fix**:
1. Check `RESEND_API_KEY` is set in Vercel
2. Check Supabase Redirect URLs includes Vercel URL
3. Check Resend dashboard for delivery status

### 500 Error / App Crashes

**Cause**: Missing environment variables

**Fix**:
1. Check Vercel deployment logs
2. Look for "Environment variable X is not defined"
3. Add missing variables
4. Redeploy

---

## 📋 Checklist

Before moving on, make sure:

- [ ] Supabase Site URL is set to `https://portal.hsnef.org`
- [ ] Supabase Redirect URLs includes all 3 URLs (localhost, dev, prod)
- [ ] Google OAuth has Supabase callback URL
- [ ] Google OAuth has all 4 redirect URIs (Supabase + 3 app URLs)
- [ ] All Vercel environment variables are set (at least the critical ones)
- [ ] `NEXT_PUBLIC_APP_URL` points to the dev Vercel URL
- [ ] Stripe webhook created for dev URL (if using payments)
- [ ] `STRIPE_WEBHOOK_SECRET` added to Vercel env vars
- [ ] Redeployed after adding env vars
- [ ] Tested Google OAuth - redirects to Vercel URL ✅
- [ ] Tested Magic Link - redirects to Vercel URL ✅
- [ ] Can navigate the portal without errors ✅

---

## 📚 Next Steps

Once dev environment is working:

1. ✅ You're done for now!
2. When ready for production, see `../guides/setup/multi-environment-setup.md`
3. Follow Phase 2 to set up Project 2 and custom domain

---

## 🆘 Need Help?

If you're stuck:

1. **Check Vercel Logs**:
   - Go to Deployments → Click deployment → Runtime Logs
   - Look for errors

2. **Check Browser Console**:
   - Right-click → Inspect → Console tab
   - Look for error messages

3. **Check Supabase Logs**:
   - Supabase Dashboard → Logs → Auth logs
   - See if auth requests are reaching Supabase

4. **Common Issues**:
   - Cached old redirects: Clear cache, use incognito
   - Env vars not applied: Redeploy after changing
   - URLs with typos: Double-check all URLs match exactly
   - Trailing slashes: Remove them from URLs
