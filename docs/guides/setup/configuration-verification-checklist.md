# Configuration Verification Checklist

Complete checklist to verify all integrations are properly configured for your multi-environment setup.

## Your Environment Summary

| Environment | Vercel Project | Branch | URL | Purpose |
|-------------|----------------|--------|-----|---------|
| **🏠 Localhost** | N/A | dev | http://localhost:3000 | **Primary Development & Testing** |
| **🧪 Dev** | dev.member | dev | https://dev.member.hsnef.org | Integration Testing & QA |
| **🚀 Production** | member | main | https://member.hsnef.org | Live Site |

**Important**: Most of your testing will happen on **localhost:3000**. Make sure it's properly configured!

---

## ✅ 1. Supabase Configuration

### 1.1 Redirect URLs

**Location**: https://app.supabase.com → Your Project → Authentication → URL Configuration

- [ ] Site URL is set to: `https://member.hsnef.org`
- [ ] Redirect URLs include:
  - [ ] `http://localhost:3000/**` ⭐ **Critical for local development!**
  - [ ] `https://dev.member.hsnef.org/**`
  - [ ] `https://member.hsnef.org/**`

### 1.2 Email Templates (for Magic Links)

**Location**: https://app.supabase.com → Your Project → Authentication → Email Templates

- [ ] Confirm email template includes: `{{ .ConfirmationURL }}`
- [ ] Magic link template includes: `{{ .ConfirmationURL }}`
- [ ] Email templates don't hardcode any specific domain

### 1.3 Verify Supabase Keys Are Set in Vercel

**Required Variables** (same for both projects):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://gapvsdrzavjaublwkqfm.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)

---

## ✅ 2. Google OAuth Configuration

### 2.1 Google Cloud Console Setup

**Location**: https://console.cloud.google.com → APIs & Services → Credentials

- [ ] OAuth 2.0 Client ID exists
- [ ] Authorized redirect URIs include:
  - [ ] `https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback` ⭐ **Most Important**
  - [ ] `http://localhost:3000/auth/callback` ⭐ **Critical for local development!**
  - [ ] `https://dev.member.hsnef.org/auth/callback`
  - [ ] `https://member.hsnef.org/auth/callback`

### 2.2 Supabase Google Provider

**Location**: https://app.supabase.com → Your Project → Authentication → Providers → Google

- [ ] Google provider is enabled
- [ ] Client ID is configured
- [ ] Client Secret is configured

### 2.3 Test Google Sign-In

**Localhost (http://localhost:3000):**
- [ ] Can click "Sign in with Google"
- [ ] Google OAuth consent screen appears
- [ ] After consent, redirects back to localhost:3000 (NOT dev or production)
- [ ] Successfully logged in and can access member dashboard

**Dev (https://dev.member.hsnef.org):**
- [ ] Can sign in with Google
- [ ] After sign-in, stays on dev.member.hsnef.org

**Production (https://member.hsnef.org):**
- [ ] Can sign in with Google
- [ ] After sign-in, stays on member.hsnef.org

**Cross-environment test:**
- [ ] After sign-in on localhost, user stays on localhost (no redirect to wrong domain)

---

## ✅ 3. Local Development Configuration

### 3.1 `.env.local` File Setup

**Location**: Root of your project: `.env.local`

**Critical Variables for Localhost:**
- [ ] `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` ⭐ **Must be localhost!**
- [ ] `NODE_ENV` = `development`
- [ ] All Supabase variables are set (same as dev/production)
- [ ] Resend API key is set
- [ ] `EMAIL_FROM` = `noreply@portal.hsnef.org`
- [ ] Stripe TEST keys are set (pk_test_... and sk_test_...)
- [ ] Security secrets are set (can reuse dev secrets)

### 3.2 Start Local Development Server

- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to start server
- [ ] Visit http://localhost:3000 in browser
- [ ] Homepage loads successfully

### 3.3 Local Stripe Webhook Testing (Optional)

If you need to test Stripe webhooks locally:

- [ ] Install Stripe CLI (`scoop install stripe` on Windows)
- [ ] Run `stripe login` to authenticate
- [ ] Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Copy the webhook signing secret (starts with `whsec_`) to `.env.local`
- [ ] Restart your dev server after updating `.env.local`

**Note**: You can test most payment functionality without webhooks. Webhooks are mainly for post-payment processing.

---

## ✅ 4. Vercel Environment Variables

### 4.1 Project "dev.member" Environment Variables

**Location**: https://vercel.com/dashboard → dev.member → Settings → Environment Variables

Core Variables:
- [ ] `NODE_ENV` = `development`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://dev.member.hsnef.org`
- [ ] `NEXT_PUBLIC_MAIN_SITE_URL` = `https://hsnef.org`

Supabase (same as production):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

Email (Resend):
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM` = `noreply@portal.hsnef.org`
- [ ] `EMAIL_FROM_NAME` = `HSNEF Membership Portal`
- [ ] `EMAIL_REPLY_TO` = `member-portal@hsnef.org`

Stripe (Test Mode):
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (test key: starts with `pk_test_`)
- [ ] `STRIPE_SECRET_KEY` = (test key: starts with `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` = (dev webhook secret)

Security (DEV-specific secrets):
- [ ] `NEXTAUTH_SECRET` = (dev secret - different from production!)
- [ ] `JWT_SECRET` = (dev secret - different from production!)
- [ ] `QR_TOKEN_SECRET` = (dev secret - different from production!)

Session:
- [ ] `SESSION_MAX_AGE` = `43200`
- [ ] `SESSION_INACTIVITY_TIMEOUT` = `3600`

Feature Flags:
- [ ] `NEXT_PUBLIC_ENABLE_VOTING` = `false`
- [ ] `NEXT_PUBLIC_ENABLE_CHATBOT` = `true`
- [ ] `NEXT_PUBLIC_ENABLE_QR_CHECKIN` = `true`

Optional:
- [ ] `OPENROUTER_API_KEY` (if using chatbot)
- [ ] `OPENROUTER_MODEL` = `anthropic/claude-3-haiku`

### 3.2 Project "member" Environment Variables

**Location**: https://vercel.com/dashboard → member → Settings → Environment Variables

Core Variables:
- [ ] `NODE_ENV` = `production`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://member.hsnef.org`
- [ ] `NEXT_PUBLIC_MAIN_SITE_URL` = `https://hsnef.org`

Supabase (same as dev):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

Email (Resend - same as dev):
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM` = `noreply@portal.hsnef.org`
- [ ] `EMAIL_FROM_NAME` = `HSNEF Membership Portal`
- [ ] `EMAIL_REPLY_TO` = `member-portal@hsnef.org`

Stripe (Live or Test Mode):
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (live: `pk_live_` or test: `pk_test_`)
- [ ] `STRIPE_SECRET_KEY` = (live: `sk_live_` or test: `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` = (production webhook secret - different from dev!)

Security (PRODUCTION-specific secrets):
- [ ] `NEXTAUTH_SECRET` = (production secret - different from dev!)
- [ ] `JWT_SECRET` = (production secret - different from dev!)
- [ ] `QR_TOKEN_SECRET` = (production secret - different from dev!)

Session:
- [ ] `SESSION_MAX_AGE` = `43200`
- [ ] `SESSION_INACTIVITY_TIMEOUT` = `3600`

Feature Flags (same as dev):
- [ ] `NEXT_PUBLIC_ENABLE_VOTING` = `false`
- [ ] `NEXT_PUBLIC_ENABLE_CHATBOT` = `true`
- [ ] `NEXT_PUBLIC_ENABLE_QR_CHECKIN` = `true`

Optional:
- [ ] `OPENROUTER_API_KEY` (if using chatbot)
- [ ] `OPENROUTER_MODEL` = `anthropic/claude-3-haiku`

### 3.3 After Adding Variables

- [ ] Redeploy **dev.member** project (Deployments → Latest → Redeploy)
- [ ] Redeploy **member** project (Deployments → Latest → Redeploy)

---

## ✅ 4. Magic Link (Email Me Link) Configuration

### 4.1 Resend Configuration

**Location**: https://resend.com/domains

- [ ] Domain `portal.hsnef.org` is verified
- [ ] DNS records (SPF, DKIM) are properly configured
- [ ] API key is valid and active

### 4.2 Test Magic Links

**Localhost (http://localhost:3000):**
- [ ] Go to login page
- [ ] Enter email address and request magic link
- [ ] Check email arrives from `noreply@portal.hsnef.org`
- [ ] Click magic link in email
- [ ] Verify redirect goes to `http://localhost:3000` (NOT dev or production)
- [ ] Verify successful login

**Dev Environment** (https://dev.member.hsnef.org):
- [ ] Go to login page
- [ ] Enter email address and request magic link
- [ ] Check email arrives from `noreply@portal.hsnef.org`
- [ ] Click magic link in email
- [ ] Verify redirect goes to `https://dev.member.hsnef.org` (NOT localhost or production)
- [ ] Verify successful login

**Production Environment** (https://member.hsnef.org):
- [ ] Go to login page
- [ ] Enter email address and request magic link
- [ ] Check email arrives from `noreply@portal.hsnef.org`
- [ ] Click magic link in email
- [ ] Verify redirect goes to `https://member.hsnef.org` (NOT dev)
- [ ] Verify successful login

### 4.3 Common Issues

If magic links redirect to wrong domain:
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set correctly in each Vercel project
- [ ] Redeploy after changing `NEXT_PUBLIC_APP_URL` (it's embedded at build time)
- [ ] Check Supabase Site URL setting matches production domain
- [ ] Clear browser cache and test in incognito mode

---

## ✅ 5. QR Code Generation & Scanning

### 5.1 QR Code Generation

**Localhost:**
- [ ] Navigate to event check-in page
- [ ] Generate QR code for a member
- [ ] Verify QR code contains URL: `http://localhost:3000/checkin?token=...`
- [ ] QR code does NOT contain dev or production URL

**Dev Environment**:
- [ ] Navigate to event check-in page
- [ ] Generate QR code for a member
- [ ] Verify QR code contains URL: `https://dev.member.hsnef.org/checkin?token=...`
- [ ] QR code does NOT contain localhost or production URL

**Production Environment**:
- [ ] Navigate to event check-in page
- [ ] Generate QR code for a member
- [ ] Verify QR code contains URL: `https://member.hsnef.org/checkin?token=...`
- [ ] QR code does NOT contain localhost or dev URL

### 5.2 QR Code Scanning

**Localhost:**
- [ ] Scan QR code (or open link manually)
- [ ] Verify page loads on `http://localhost:3000`
- [ ] Verify check-in is successful
- [ ] Verify member data is displayed correctly

**Dev Environment**:
- [ ] Scan QR code (or open link manually)
- [ ] Verify page loads on `https://dev.member.hsnef.org`
- [ ] Verify check-in is successful
- [ ] Verify member data is displayed correctly

**Production Environment**:
- [ ] Scan QR code (or open link manually)
- [ ] Verify page loads on `https://member.hsnef.org`
- [ ] Verify check-in is successful
- [ ] Verify member data is displayed correctly

### 5.3 Token Security

- [ ] Verify `QR_TOKEN_SECRET` is set in **dev.member** project
- [ ] Verify `QR_TOKEN_SECRET` is set in **member** project
- [ ] Verify the secrets are DIFFERENT between dev and production
- [ ] Test that QR code from dev environment CANNOT be scanned in production (and vice versa)

---

## ✅ 6. Stripe Payment Integration

### 6.1 Stripe Webhooks

**Location**: https://dashboard.stripe.com/webhooks

**Dev Webhook**:
- [ ] Webhook exists with URL: `https://dev.member.hsnef.org/api/stripe/webhook`
- [ ] Mode: Test mode
- [ ] Events listened:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
- [ ] Webhook signing secret is copied to **dev.member** Vercel project as `STRIPE_WEBHOOK_SECRET`

**Production Webhook**:
- [ ] Webhook exists with URL: `https://member.hsnef.org/api/stripe/webhook`
- [ ] Mode: Live mode (or Test mode if not ready for live payments)
- [ ] Events listened:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
- [ ] Webhook signing secret is copied to **member** Vercel project as `STRIPE_WEBHOOK_SECRET`

### 6.2 Test Payment Flow

**Dev Environment** (Test Mode):
- [ ] Navigate to membership payment page
- [ ] Enter test card: `4242 4242 4242 4242`, future expiry, any CVC
- [ ] Complete payment
- [ ] Verify payment succeeds in Stripe Dashboard (Test mode)
- [ ] Verify webhook is received (check Stripe webhook logs)
- [ ] Verify membership is updated in database
- [ ] Verify confirmation email is sent

**Production Environment** (when using Live Mode):
- [ ] Use real payment card (small amount for testing)
- [ ] Complete payment
- [ ] Verify payment succeeds in Stripe Dashboard (Live mode)
- [ ] Verify webhook is received
- [ ] Verify membership is updated in database
- [ ] Verify confirmation email is sent

### 6.3 Common Issues

If webhooks fail:
- [ ] Check webhook signing secret matches in Vercel
- [ ] Verify webhook endpoint is accessible (test with `curl` or Postman)
- [ ] Check webhook logs in Stripe Dashboard for error details
- [ ] Ensure `STRIPE_WEBHOOK_SECRET` was set before deployment (redeploy if needed)

---

## ✅ 7. Email Configuration (Resend)

### 7.1 Domain Verification

**Location**: https://resend.com/domains

- [ ] Domain `portal.hsnef.org` shows as "Verified"
- [ ] SPF record is added to DNS
- [ ] DKIM record is added to DNS
- [ ] Can send test email from Resend dashboard

### 7.2 Test All Email Types

**Dev Environment**:
- [ ] Magic link email works (tested in section 4)
- [ ] Registration confirmation email works
- [ ] Password reset email works (if applicable)
- [ ] Payment confirmation email works
- [ ] QR code email works (if feature enabled)

**Production Environment**:
- [ ] Magic link email works (tested in section 4)
- [ ] Registration confirmation email works
- [ ] Password reset email works (if applicable)
- [ ] Payment confirmation email works
- [ ] QR code email works (if feature enabled)

### 7.3 Email Deliverability

- [ ] Emails arrive in inbox (not spam)
- [ ] "From" address shows as `noreply@portal.hsnef.org`
- [ ] "From" name shows as `HSNEF Membership Portal`
- [ ] "Reply-To" is set to `member-portal@hsnef.org`
- [ ] Email templates render correctly (HTML + plain text)

---

## ✅ 8. Cross-Environment Isolation

### 8.1 Security Isolation

- [ ] Dev and production use DIFFERENT secrets:
  - [ ] `NEXTAUTH_SECRET` is different
  - [ ] `JWT_SECRET` is different
  - [ ] `QR_TOKEN_SECRET` is different
- [ ] Sessions from dev cannot be used in production (test by copying cookies)
- [ ] QR codes from dev cannot be scanned in production
- [ ] JWT tokens from dev are invalid in production

### 8.2 Data Isolation

**Note**: You're using the same Supabase project for both environments.

- [ ] Understand that dev and production share the same database
- [ ] Consider using test member accounts clearly labeled (e.g., "TEST - John Doe")
- [ ] If possible, add a `is_test` flag to distinguish test data
- [ ] For true isolation, consider separate Supabase projects in the future

### 8.3 URL Consistency

- [ ] All links in dev environment use `https://dev.member.hsnef.org`
- [ ] All links in production use `https://member.hsnef.org`
- [ ] No hardcoded URLs in codebase (all use `NEXT_PUBLIC_APP_URL`)
- [ ] Test navigation: clicking links stays within the same environment

---

## ✅ 9. Git Workflow

### 9.1 Branch Strategy

- [ ] `dev` branch deploys to **dev.member** project (https://dev.member.hsnef.org)
- [ ] `main` branch deploys to **member** project (https://member.hsnef.org)
- [ ] Feature branches merge to `dev` first
- [ ] Changes are tested on dev before merging to `main`

### 9.2 Deployment Flow

- [ ] Push to `dev` branch triggers automatic deployment to dev.member.hsnef.org
- [ ] Push to `main` branch triggers automatic deployment to member.hsnef.org
- [ ] Vercel deployment status is visible in GitHub pull requests
- [ ] Failed deployments send notifications (check Vercel integrations)

---

## ✅ 10. Final Integration Tests

### 10.1 End-to-End Test (Localhost)

Complete flow on http://localhost:3000:
- [ ] Visit homepage
- [ ] Click "Sign In with Google" → successful Google login
- [ ] Visit member dashboard → see member information
- [ ] Update profile → changes saved successfully
- [ ] Navigate to payment page → complete test payment (card: 4242 4242 4242 4242)
- [ ] Verify payment succeeds (check Stripe Dashboard)
- [ ] Generate QR code for event → QR code contains localhost URL
- [ ] Scan QR code → check-in successful
- [ ] Sign out → redirected to homepage

### 10.2 End-to-End Test (Dev)

Complete flow on https://dev.member.hsnef.org:
- [ ] Visit homepage
- [ ] Click "Sign In with Google" → successful Google login
- [ ] Visit member dashboard → see member information
- [ ] Update profile → changes saved successfully
- [ ] Navigate to payment page → complete test payment
- [ ] Verify payment confirmation email received
- [ ] Check admin panel → payment appears in system
- [ ] Generate QR code for event → QR code contains dev URL
- [ ] Scan QR code → check-in successful
- [ ] Sign out → redirected to homepage

### 10.3 End-to-End Test (Production)

Complete flow on https://member.hsnef.org:
- [ ] Visit homepage
- [ ] Click "Sign In with Google" → successful Google login
- [ ] Visit member dashboard → see member information
- [ ] Update profile → changes saved successfully
- [ ] Navigate to payment page → (skip live payment for now)
- [ ] Generate QR code for event → QR code contains production URL
- [ ] Scan QR code → check-in successful
- [ ] Sign out → redirected to homepage

---

## 📋 Summary Checklist

Quick reference for overall setup:

### Local Development (localhost:3000)
- [ ] `.env.local` file configured correctly
- [ ] `NEXT_PUBLIC_APP_URL` = `http://localhost:3000`
- [ ] All Supabase credentials set
- [ ] Stripe TEST keys configured
- [ ] `npm run dev` starts successfully
- [ ] Google OAuth works on localhost
- [ ] Magic links redirect to localhost
- [ ] QR codes use localhost URL

### External Services
- [ ] Supabase: All redirect URLs configured (including localhost!)
- [ ] Google OAuth: All callback URLs configured (including localhost!)
- [ ] Resend: Domain `portal.hsnef.org` verified, DNS records added
- [ ] Stripe: 2 webhooks created (dev + production)
- [ ] Cloudflare: DNS pointing to Vercel correctly

### Vercel Projects
- [ ] **dev.member**: All environment variables set
- [ ] **member**: All environment variables set
- [ ] Both projects: Deployed successfully
- [ ] Custom domains: Both working correctly

### Integrations (Test on ALL 3 environments!)
- [ ] Google Sign-In: Works on localhost, dev, and production
- [ ] Magic Links: Works on all environments, redirects to correct URL
- [ ] QR Codes: Generate with correct URLs, scan successfully
- [ ] Stripe Payments: Webhooks working, payments processed
- [ ] Emails: Delivered successfully, correct sender

### Security
- [ ] Different secrets between dev and production
- [ ] Sessions isolated between environments
- [ ] QR codes isolated between environments
- [ ] Stripe test vs live mode correctly configured

---

## 🆘 Troubleshooting Resources

If you encounter issues, refer to:
- [Multi-Environment Setup Guide](./multi-environment-setup.md)
- [Supabase Auth Setup](./supabase-auth-setup.md)
- [Vercel Setup Guide](./vercel-setup-guide.md)
- [Auth Troubleshooting](../../troubleshooting/auth-troubleshooting.md)

---

**Last Updated**: 2026-01-10
**Status**: Ready for verification
