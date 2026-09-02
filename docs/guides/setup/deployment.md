# Deployment Guide

This guide covers the deployment setup for the HSNEF Membership Portal with separate dev and production environments.

## Environment Overview

- **Dev Environment**: `dev` branch → Vercel `dev-msp` project → `dev-portal.vercel.app`
- **Prod Environment**: `main` branch → Vercel `prod-hsnef` project → `member.hsnef.org`

Both environments use the same Supabase dev project and database.

## Git Workflow

### Branch Structure

```
main (production)
  ↑
dev (development)
  ↑
feature branches (optional)
```

### Working with Branches

#### Switch to Dev Branch
```bash
git checkout dev
```

#### Switch to Main Branch
```bash
git checkout main
```

#### Push Changes to Dev
```bash
git checkout dev
git add .
git commit -m "Your commit message"
git push origin dev
```

#### Merge Dev to Main (Production Deployment)
```bash
# 1. Ensure dev branch is up to date
git checkout dev
git pull origin dev

# 2. Switch to main and merge
git checkout main
git pull origin main
git merge dev

# 3. Push to main (triggers production deployment)
git push origin main
```

#### Create Feature Branch
```bash
git checkout dev
git checkout -b feature/your-feature-name
# Make changes, commit, push
git push -u origin feature/your-feature-name
# When done, merge back to dev
```

## Vercel Project Setup

### Initial Setup (One-Time)

1. **Create Dev Project** (`dev-msp`)
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import repository: `hsnef/member-portal`
   - Project Name: `dev-msp`
   - Framework Preset: Next.js
   - Root Directory: `.` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`
   - **Production Branch**: Leave as `main` initially, then change to `dev` in settings

2. **Configure Dev Project Branch**
   - After creating, go to Project Settings → Git
   - Change Production Branch to `dev`
   - Or create a new branch configuration for `dev`

3. **Create Prod Project** (`prod-hsnef`)
   - Follow same steps as above
   - Project Name: `prod-hsnef`
   - **Production Branch**: `main`

4. **Add Custom Domain (Production)**
   - In `prod-hsnef` project, go to Settings → Domains
   - Add domain: `member.hsnef.org`
   - Configure DNS records as instructed by Vercel
   - Wait for DNS propagation and SSL certificate

### Environment Variables

Configure the following environment variables in both Vercel projects:

#### Supabase (Same for both environments)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

#### Stripe
- `STRIPE_SECRET_KEY` - Stripe secret key (test or live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (test or live)
- `STRIPE_WEBHOOK_SECRET` - **Different per environment** (dev and prod webhooks)

#### Email (Resend or SMTP)
- `RESEND_API_KEY` - Resend API key (if using Resend)
- OR SMTP configuration:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
- `EMAIL_FROM` - Sender email address
- `EMAIL_FROM_NAME` - Sender name
- `EMAIL_REPLY_TO` - Reply-to email address

#### Application
- `QR_TOKEN_SECRET` - Secret key for QR token signing (same or different per env)
- `NEXT_PUBLIC_APP_URL` - 
  - Dev: `https://dev-portal.vercel.app`
  - Prod: `https://member.hsnef.org`

#### Optional
- `OPENROUTER_API_KEY` - For chatbot feature (if enabled)

### Setting Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope:
   - **Production**: Only applied to `main` branch
   - **Preview**: Applied to all non-production branches
   - **Development**: Applied to local development
3. Click "Save" after adding each variable

## Authentication Configuration

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID

2. **Add Authorized Redirect URIs**
   Add all the following URLs:
   ```
   https://dev-portal.vercel.app/auth/callback
   https://member.hsnef.org/auth/callback
   http://localhost:3000/auth/callback
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

3. **Save Changes**

### Supabase Authentication Configuration

1. **Go to Supabase Dashboard**
   - Visit [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Authentication → URL Configuration

2. **Configure Site URL**
   - Set to: `https://member.hsnef.org` (production URL)
   - Note: This can be either dev or prod URL; redirect URLs handle both

3. **Configure Redirect URLs**
   Add all the following URLs (comma-separated):
   ```
   https://dev-portal.vercel.app/auth/callback,https://dev-portal.vercel.app/**,
   https://member.hsnef.org/auth/callback,https://member.hsnef.org/**,
   http://localhost:3000/auth/callback,http://localhost:3000/**
   ```

4. **Save Changes**

**Note**: Since both environments use the same Supabase project, all redirect URLs must be configured together.

### Magic Link Configuration

Magic links work automatically once the redirect URLs above are configured. No additional setup needed.

## Stripe Webhook Configuration

Each environment needs its own webhook endpoint configured in Stripe:

### Dev Environment Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://dev-portal.vercel.app/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `checkout.session.completed`
4. Copy the webhook signing secret
5. Add to Vercel `dev-msp` project as `STRIPE_WEBHOOK_SECRET`

### Prod Environment Webhook
1. Add endpoint: `https://member.hsnef.org/api/stripe/webhook`
2. Select same events
3. Copy the webhook signing secret
4. Add to Vercel `prod-hsnef` project as `STRIPE_WEBHOOK_SECRET`

## Automated Deployments

### Vercel GitHub Integration (Recommended)

Vercel automatically deploys when code is pushed to the configured branch:

- **Dev**: Push to `dev` branch → deploys to `dev-msp` project
- **Prod**: Push to `main` branch → deploys to `prod-hsnef` project

No additional configuration needed if projects are properly linked.

### Manual Deployment

If needed, you can deploy manually using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to dev
vercel --prod --scope dev-msp

# Deploy to prod
vercel --prod --scope prod-hsnef
```

## Deployment Process

### Development Deployment

1. Make changes in `dev` branch
2. Commit and push:
   ```bash
   git checkout dev
   git add .
   git commit -m "Your changes"
   git push origin dev
   ```
3. Vercel automatically deploys to `dev-portal.vercel.app`
4. Verify deployment at dev URL

### Production Deployment

1. Merge `dev` to `main`:
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```
2. Vercel automatically deploys to `member.hsnef.org`
3. Verify deployment at production URL
4. Test critical flows in production

## Version Generation

The version number is automatically generated during build based on git commits:

- Runs automatically via `npm run build` (includes `npm run generate-version`)
- Major version: Set manually in `scripts/generate-version.ts`
- Minor/Patch: Auto-calculated from commit count
- Version displayed in footer of all pages

## Troubleshooting

### Deployment Fails

1. **Check Build Logs**
   - Go to Vercel project → Deployments
   - Click on failed deployment
   - Review build logs for errors

2. **Common Issues**
   - Missing environment variables
   - Build script failures
   - TypeScript errors
   - Missing dependencies

### Authentication Not Working

1. **Check Redirect URLs**
   - Verify Google OAuth redirect URLs include your domain
   - Verify Supabase redirect URLs include your domain
   - Ensure URLs match exactly (including https/http)

2. **Check Environment Variables**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

3. **Check Browser Console**
   - Look for authentication errors
   - Check network requests

### Environment Variables Not Loading

1. **Redeploy After Adding Variables**
   - Environment variables are only available after redeploy
   - Go to project → Deployments → Redeploy

2. **Check Variable Scope**
   - Ensure variables are set for correct environment (Production/Preview)

### Custom Domain Not Working

1. **Check DNS Records**
   - Verify DNS records are correctly configured
   - Wait for DNS propagation (can take up to 48 hours)

2. **Check SSL Certificate**
   - Vercel automatically provisions SSL
   - May take a few minutes after DNS is configured

## Rollback Procedures

### Rollback in Vercel

1. Go to Project → Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback

### Rollback via Git

1. Revert commit in git:
   ```bash
   git revert <commit-hash>
   git push origin main  # or dev
   ```
2. Vercel will redeploy with reverted code

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and merged to `main`
- [ ] Environment variables configured
- [ ] Stripe webhook configured for production
- [ ] OAuth redirect URLs updated
- [ ] Supabase redirect URLs updated
- [ ] Custom domain configured and working
- [ ] Test authentication flows
- [ ] Test payment flows
- [ ] Test critical user paths
- [ ] Verify version number is correct

## Monitoring

- **Vercel Analytics**: Available in Vercel dashboard
- **Error Tracking**: Check Vercel deployment logs
- **Supabase Logs**: Check Supabase dashboard for auth/database issues
- **Stripe Dashboard**: Monitor payment activity

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review this guide
3. Check GitHub issues
4. Contact support if needed
