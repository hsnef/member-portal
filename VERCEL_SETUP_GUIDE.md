# Vercel Project Setup Guide

This guide provides step-by-step instructions for setting up the `dev-msp` and `prod-hsnef` Vercel projects.

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository: `hsnef/member-portal`
- Access to GitHub account with repository access

## Step 1: Create Dev Project (`dev-msp`)

### 1.1 Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import Git Repository:
   - If not connected: Click **"Import Git Repository"** → Connect GitHub → Authorize
   - Select repository: **`hsnef/member-portal`**
   - Click **"Import"**

### 1.2 Configure Project Settings

On the project configuration page:

1. **Project Name**: `dev-memberportal`
2. **Framework Preset**: Select **Next.js** (should auto-detect)
3. **Root Directory**: `.` (default - project root)
4. **Build Command**: `npm run build` (default)
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install` (default)

**Important**: Do NOT click "Deploy" yet.

### 1.3 Configure Git Branch

1. Scroll down to **"Git"** section
2. Under **"Production Branch"**, click **"Change"**
3. Select **`dev`** branch
4. Click **"Save"**

**OR** if you can't change it here:
- Deploy the project first with default settings
- After deployment, go to **Project Settings** → **Git**
- Change **Production Branch** to `dev`

### 1.4 Add Environment Variables

**Before deploying**, add environment variables:

1. Click **"Environment Variables"** section
2. Add each variable from [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
3. For each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Variable value
   - **Environment**: 
     - Select **"Preview"** for dev environment (or **"Production"** if using `dev` as production branch)
     - Can also select **"Development"** for local development

4. Click **"Add"** after each variable

**Required Variables** (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for full list):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (create webhook in Stripe first - see below)
- `NEXT_PUBLIC_APP_URL` = `https://dev-portal.vercel.app` (will be assigned after deployment)
- `QR_TOKEN_SECRET`
- Email variables (Resend or SMTP)
- Any other variables from your `.env.local`

### 1.5 Deploy Project

1. Review all settings
2. Click **"Deploy"**
3. Wait for deployment to complete
4. Note the deployment URL: `https://dev-msp-xxxxx.vercel.app` or `https://dev-portal.vercel.app`

### 1.6 Update Environment Variables After Deployment

After first deployment, update:

1. Go to **Project Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to the actual deployment URL:
   - Value: `https://dev-portal.vercel.app` (or the URL Vercel assigned)
3. **Redeploy** the project for changes to take effect

## Step 2: Create Prod Project (`prod-hsnef`)

### 2.1 Create New Project

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Import the same repository: **`hsnef/member-portal`**
3. Click **"Import"**

### 2.2 Configure Project Settings

1. **Project Name**: `prod-hsnef`
2. **Framework Preset**: **Next.js**
3. **Root Directory**: `.` (default)
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. **Install Command**: `npm install`

**Production Branch**: Should be set to **`main`** (default)

### 2.3 Add Environment Variables

Add all the same environment variables, but with production-specific values:

1. Most variables are the same (Supabase, etc.)
2. Update these for production:
   - `NEXT_PUBLIC_APP_URL` = `https://portal.hsnef.org` (custom domain - set after adding domain)
   - `STRIPE_WEBHOOK_SECRET` = Different webhook secret (create separate webhook in Stripe)
   - `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Live keys (if using live mode for prod)

3. For each variable, select **"Production"** environment

### 2.4 Deploy Project

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note the deployment URL

## Step 3: Configure Custom Domain (Production)

### 3.1 Add Custom Domain

1. Go to **`prod-hsnef`** project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `portal.hsnef.org`
4. Click **"Add"**

### 3.2 Configure DNS Records

Vercel will display DNS records to add. You'll need:

1. Go to your DNS provider (where `hsnef.org` is managed)
2. Add DNS record as instructed by Vercel:
   - Usually a **CNAME** record:
     - Name: `portal`
     - Value: `cname.vercel-dns.com` (or similar)
   - OR an **A** record if instructed

3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

### 3.3 Verify SSL Certificate

1. Vercel automatically provisions SSL certificate
2. Check **Domains** page for certificate status
3. Certificate is usually ready within minutes after DNS is configured

### 3.4 Update Environment Variable

After domain is configured and SSL is active:

1. Go to **Project Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL`:
   - Value: `https://portal.hsnef.org`
3. **Redeploy** project

## Step 4: Configure Stripe Webhooks

### 4.1 Create Dev Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. **Endpoint URL**: `https://dev-portal.vercel.app/api/stripe/webhook`
   - (Use actual dev URL from Vercel if different)
5. **Events to listen to**:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
6. Click **"Add endpoint"**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Vercel `dev-msp` project:
   - Go to **Environment Variables**
   - Add: `STRIPE_WEBHOOK_SECRET` = (signing secret)
   - Select **"Preview"** environment
   - **Redeploy**

### 4.2 Create Prod Webhook

1. In Stripe Dashboard → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://portal.hsnef.org/api/stripe/webhook`
4. **Events to listen to**: Same as above
5. Click **"Add endpoint"**
6. Copy the **Signing secret**
7. Add to Vercel `prod-hsnef` project:
   - Go to **Environment Variables**
   - Add: `STRIPE_WEBHOOK_SECRET` = (signing secret)
   - Select **"Production"** environment
   - **Redeploy**

## Step 5: Configure GitHub Integration

### 5.1 Verify Integration

1. Both projects should be linked to GitHub automatically
2. Go to **Project Settings** → **Git**
3. Verify:
   - Repository: `hsnef/member-portal`
   - Production Branch:
     - `dev-msp`: `dev`
     - `prod-hsnef`: `main`

### 5.2 Enable Automatic Deployments

1. Automatic deployments should be enabled by default
2. Verify in **Project Settings** → **Git**:
   - **"Automatic deployments from Git"** should be ON
   - **"Auto-assign Custom Domains"** should be ON

### 5.3 Configure Production Branch Protection (Optional)

For `prod-hsnef` project, you can require manual approval:

1. Go to **Project Settings** → **Git**
2. Enable **"Require approval before deploying"**
3. This adds a safety check before production deployments

## Step 6: Update Authentication Redirect URLs

### 6.1 Update Google OAuth Redirect URLs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click **Edit**
5. Add to **Authorized redirect URIs**:
   ```
   https://dev-portal.vercel.app/auth/callback
   https://portal.hsnef.org/auth/callback
   ```
   (Add actual dev URL if different)
6. Click **Save**

### 6.2 Update Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In **Site URL**, set to: `https://portal.hsnef.org` (or `https://dev-portal.vercel.app` for testing)
5. In **Redirect URLs**, add (comma-separated):
   ```
   https://dev-portal.vercel.app/auth/callback,https://dev-portal.vercel.app/**,
   https://portal.hsnef.org/auth/callback,https://portal.hsnef.org/**,
   http://localhost:3000/auth/callback,http://localhost:3000/**
   ```
6. Click **Save**

## Step 7: Verify Deployments

### 7.1 Test Dev Deployment

1. Visit: `https://dev-portal.vercel.app` (or your dev URL)
2. Verify site loads
3. Test authentication:
   - Try Google OAuth login
   - Try magic link login
4. Verify footer shows version number
5. Test critical user flows

### 7.2 Test Prod Deployment

1. Visit: `https://portal.hsnef.org`
2. Verify site loads
3. Test authentication
4. Verify all functionality works
5. Test payment flows (if applicable)

## Troubleshooting

### Deployment Fails

1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Check for TypeScript/build errors
4. Verify git branch is correct

### Authentication Not Working

1. Verify redirect URLs are configured correctly
2. Check environment variables are set
3. Verify `NEXT_PUBLIC_APP_URL` matches actual deployment URL
4. Check browser console for errors

### Custom Domain Not Working

1. Verify DNS records are configured correctly
2. Wait for DNS propagation (can take up to 48 hours)
3. Check SSL certificate status in Vercel
4. Verify domain is correctly added to project

### Environment Variables Not Loading

1. Ensure variables are set for correct environment (Production/Preview)
2. Redeploy after adding variables
3. Check variable names are spelled correctly (case-sensitive)

## Next Steps

After setup is complete:

1. Test all deployments
2. Update documentation with actual URLs
3. Set up monitoring (if desired)
4. Configure production branch protection (recommended)
5. Review security settings

## Summary Checklist

- [ ] `dev-msp` project created and configured
- [ ] `dev-msp` environment variables added
- [ ] `dev-msp` deployed successfully
- [ ] `prod-hsnef` project created and configured
- [ ] `prod-hsnef` environment variables added
- [ ] `prod-hsnef` deployed successfully
- [ ] Custom domain `portal.hsnef.org` added and configured
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Stripe webhooks configured for both environments
- [ ] Google OAuth redirect URLs updated
- [ ] Supabase redirect URLs updated
- [ ] Both deployments tested and working
- [ ] Authentication flows tested
- [ ] GitHub integration verified
- [ ] Automatic deployments working
