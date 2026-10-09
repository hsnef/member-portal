# Environment Variables Reference

> ### ⚠️ Some variables below do not exist
>
> Verified against the code 2026-09-03 — **nothing in this codebase reads**
> `OPENROUTER_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` or `SMTP_PASSWORD`.
> They were planned or copied in and never wired up. Do not provision keys or
> set values for them; you will be configuring nothing.
>
> The canonical list of variables the code *actually* reads is
> [`.env.local.example`](../../../.env.local.example).

> **The canonical list is [`.env.local.example`](../../../.env.local.example)**, which is
> checked against the code. This document is the narrative version; where the two
> disagree, the example file wins. Start with `cp .env.local.example .env.local`.

> ⚠️ **Which Supabase project is which: [`docs/SUPABASE-PROJECTS.md`](../../SUPABASE-PROJECTS.md).**
> `gapvsdrzavjaublwkqfm` is PRODUCTION. Anything calling it "dev" predates the
> 2026-09-02 split and is wrong.

## Required Variables

### Supabase Configuration

⚠️ **Not any more.** Dev and production were split on 2026-09-02 (DEC-006).
Local and dev use `dev-mp` (`bcujsesgrzijyisvmnwm`); production uses `prod-mp`
(`gapvsdrzavjaublwkqfm`). That second ref reads as "dev" in anything written
before the split because it was the shared project and kept its ID — it is
PRODUCTION. Point local work at `bcujsesgrzijyisvmnwm`.

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGc...` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | `eyJhbGc...` | Yes |

**Where to find:**
- Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (keep secret!)

### Stripe Configuration

Use Stripe test keys for dev, live keys for production (or same test keys for both if desired).

| Variable | Description | Example | Required | Different per Env |
|----------|-------------|---------|----------|-------------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` | Yes | Optional |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` or `pk_live_...` | Yes | Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` | Yes | **Yes** (different per env) |

**Where to find:**
- Stripe Dashboard → Developers → API keys
- `STRIPE_WEBHOOK_SECRET`: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret

**Note:** Each environment needs its own webhook endpoint configured in Stripe with a different webhook secret.

### Email Configuration (Resend)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RESEND_API_KEY` | Resend API key | `re_xxxxx...` | Yes* |
| `EMAIL_FROM` | Sender email address | `noreply@portal.hsnef.org` | Yes |
| `EMAIL_FROM_NAME` | Sender name | `HSNEF Membership Portal` | Yes |
| `EMAIL_REPLY_TO` | Reply-to email address | `info@hsnef.org` | Yes |

\* If using SMTP instead of Resend, see SMTP section below.

**Where to find:**
- Resend Dashboard → API Keys
- Create a new API key with appropriate permissions

### Email Configuration (SMTP Alternative)

If using SMTP instead of Resend:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | `smtp-relay.gmail.com` | Yes* |
| `SMTP_PORT` | SMTP server port | `587` | Yes* |
| `SMTP_SECURE` | Use TLS/SSL | `false` | Yes* |
| `SMTP_USER` | SMTP username | `noreply@hsnef.org` | Optional |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` | Optional |
| `EMAIL_FROM` | Sender email address | `noreply@portal.hsnef.org` | Yes |
| `EMAIL_FROM_NAME` | Sender name | `HSNEF Membership Portal` | Yes |
| `EMAIL_REPLY_TO` | Reply-to email address | `info@hsnef.org` | Yes |

\* Required if using SMTP (either Resend OR SMTP, not both)

**Note:** If using Google Workspace SMTP with IP allow-listing, `SMTP_USER` and `SMTP_PASSWORD` may not be required.

### Application Configuration

| Variable | Description | Example | Required | Different per Env |
|----------|-------------|---------|----------|-------------------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://dev-portal.vercel.app` (dev)<br>`https://member.hsnef.org` (prod) | Yes | **Yes** |
| `QR_TOKEN_SECRET` | Secret key for QR token signing | Random 32+ character string | Yes | Optional |

**Note:**
- `NEXT_PUBLIC_APP_URL` must match the actual deployment URL:
  - Dev: `https://dev-portal.vercel.app`
  - Prod: `https://member.hsnef.org`
- `QR_TOKEN_SECRET`: Generate a secure random string (e.g., `openssl rand -base64 32`)

### Optional: AI/Chatbot (OpenRouter)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| ~~`OPENROUTER_API_KEY`~~ | **Not used.** No chatbot exists and nothing reads this variable. Do not provision a key for it. | — | — |

## Environment-Specific Configuration

### Dev Environment (`dev-msp` project)

Set these in Vercel project settings → Environment Variables → Preview:

```
NEXT_PUBLIC_APP_URL=https://dev-portal.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_dev_webhook_secret
```

### Prod Environment (`prod-hsnef` project)

Set these in Vercel project settings → Environment Variables → Production:

```
NEXT_PUBLIC_APP_URL=https://member.hsnef.org
STRIPE_WEBHOOK_SECRET=whsec_prod_webhook_secret
```

## Setting Variables in Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add each variable:
   - **Name**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Variable value (paste from your .env.local or config)
   - **Environment**: Select which environments apply
     - **Production**: Only `main` branch
     - **Preview**: All non-production branches (`dev`, feature branches)
     - **Development**: Local development (usually not needed)
3. Click "Save"
4. **Important**: Redeploy after adding environment variables

## Variable Scope Guidelines

### Same for Both Environments
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (if using test mode for both)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using test mode for both)
- `RESEND_API_KEY` or SMTP configs
- `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`
- `QR_TOKEN_SECRET` (optional - can be same or different)

### Different per Environment
- `NEXT_PUBLIC_APP_URL` (**must** be different)
- `STRIPE_WEBHOOK_SECRET` (**must** be different - different webhooks)
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using test for dev, live for prod)

## Security Notes

1. **Never commit environment variables to git**
   - Add `.env.local` to `.gitignore` (already done)
   - Use Vercel's environment variable settings for deployments

2. **Service role keys are sensitive**
   - `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - keep secure
   - Only use server-side, never expose to client

3. **Webhook secrets are sensitive**
   - Used to verify webhook authenticity
   - Different secret per environment

4. **API keys are sensitive**
   - Stripe, Resend, OpenRouter keys grant access to your account
   - Keep secure and rotate if compromised

## Verification Checklist

Before deploying, verify:

- [ ] All required variables are set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches deployment URL
- [ ] Stripe webhook secrets are different for dev/prod
- [ ] Supabase variables are set correctly
- [ ] Email configuration is correct (Resend or SMTP)
- [ ] All variables marked as Production or Preview as appropriate
- [ ] Redeployed after adding variables

## Troubleshooting

### Variables Not Loading

1. **Check variable scope**: Ensure variables are set for correct environment (Production/Preview)
2. **Redeploy**: Variables are only available after redeployment
3. **Check spelling**: Variable names are case-sensitive
4. **Check prefix**: `NEXT_PUBLIC_*` variables are available client-side, others are server-only

### Build Fails Due to Missing Variables

1. Check build logs in Vercel for specific missing variable
2. Verify variable is set for correct environment
3. Ensure variable name matches exactly (case-sensitive)

### Authentication Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check that `NEXT_PUBLIC_APP_URL` matches actual deployment URL

### Payment Issues

- Verify Stripe keys are correct (test vs live)
- Check webhook secret matches the webhook endpoint in Stripe
- Ensure webhook endpoint URL in Stripe matches deployment URL
