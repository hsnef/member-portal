# Resend Email Setup Guide

Complete guide to configure Resend for the HSNEF Membership Portal.

## Overview

**Resend** is a modern email API built for developers with excellent deliverability and beautiful templates.

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- All features included

**Paid Plans:**
- $20/month for 50,000 emails
- No daily limits

---

## Setup Steps

### 1. Create Resend Account

1. **Sign up at Resend**
   - Go to [resend.com](https://resend.com)
   - Click **Sign Up**
   - Sign up with GitHub or email

2. **Verify your email**
   - Check your inbox
   - Click the verification link

---

### 2. Add and Verify Your Domain

**You need to verify `members.hsnef.org` to send from `noreply@members.hsnef.org`**

1. **Add Domain in Resend**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Click **Add Domain**
   - Enter: `members.hsnef.org`
   - Click **Add**

2. **Add DNS Records**

   Resend will show you 3 DNS records to add:

   **SPF Record:**
   ```
   Type: TXT
   Name: members.hsnef.org (or @)
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Record 1:**
   ```
   Type: TXT
   Name: resend._domainkey.members.hsnef.org
   Value: [Resend provides this - copy from dashboard]
   ```

   **DKIM Record 2:**
   ```
   Type: TXT
   Name: resend2._domainkey.members.hsnef.org
   Value: [Resend provides this - copy from dashboard]
   ```

3. **Add DNS Records to Your DNS Provider**

   **If using Cloudflare (most likely):**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Select `hsnef.org` domain
   - Click **DNS** → **Records**
   - Click **Add record**
   - Add all 3 TXT records from Resend
   - Click **Save**

4. **Verify Domain in Resend**
   - Wait 5-10 minutes for DNS propagation
   - Go back to Resend dashboard
   - Click **Verify** next to your domain
   - Status should change to **Verified** ✅

---

### 3. Get API Key

1. **Create API Key**
   - Go to [resend.com/api-keys](https://resend.com/api-keys)
   - Click **Create API Key**
   - Name: "HSNEF Membership Portal"
   - Permission: **Sending access**
   - Click **Add**

2. **Copy API Key**
   - Copy the key starting with `re_`
   - **Save it securely** - you won't see it again!
   - Example: `re_123abc456def789...`

---

### 4. Configure Environment Variables

Add to your `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_actual_api_key_here

# Email Addresses
EMAIL_FROM=noreply@members.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=info@hsnef.org
```

---

### 5. Test Your Configuration

#### Development Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Send test email:**
   ```bash
   curl "http://localhost:3000/api/email/test?to=your-email@example.com"
   ```

   OR visit in browser:
   ```
   http://localhost:3000/api/email/test?to=your-email@example.com
   ```

3. **Check your inbox** for the test email

#### Production Testing

After deploying to Vercel:

1. Add `RESEND_API_KEY` to Vercel environment variables
2. Deploy
3. Send a test registration invitation from admin panel

---

## DNS Configuration Details

### Why DNS Records Are Needed

- **SPF:** Tells email servers that Resend is authorized to send from your domain
- **DKIM:** Cryptographic signature that proves emails are from you
- **Result:** Better deliverability, fewer spam folder emails

### DNS Propagation Time

- **Typically:** 5-10 minutes
- **Maximum:** Up to 24 hours
- **Check status:** [dnschecker.org](https://dnschecker.org)

### Verify DNS Records Are Set

```bash
# Check SPF
nslookup -type=TXT members.hsnef.org

# Check DKIM
nslookup -type=TXT resend._domainkey.members.hsnef.org
```

---

## Troubleshooting

### Error: "Domain not verified"

**Solution:**
- Check DNS records are added correctly
- Wait 10-15 minutes for DNS propagation
- Use [dnschecker.org](https://dnschecker.org) to verify DNS
- Click "Verify" again in Resend dashboard

### Error: "Invalid API key"

**Solution:**
- Make sure you copied the full API key (starts with `re_`)
- Check for extra spaces in `.env.local`
- Regenerate API key if lost

### Emails go to spam

**Solution:**
- Ensure domain is verified in Resend
- Add all 3 DNS records (SPF + 2 DKIM)
- Wait 24-48 hours for email reputation to build
- Send from `noreply@members.hsnef.org` (verified domain)

### Error: "Daily sending limit exceeded"

**Solution:**
- Free tier: 100 emails/day limit
- Upgrade to paid plan ($20/month) for unlimited daily sending
- Or wait until next day (limit resets at midnight UTC)

---

## Resend Dashboard Features

### Email Logs
- View all sent emails
- See delivery status
- Check opens and clicks (if tracking enabled)
- Debug failed sends

### Webhooks (Optional)
- Get notified of delivery, bounces, complaints
- Set up at [resend.com/webhooks](https://resend.com/webhooks)
- Useful for tracking email engagement

### Analytics
- Track sending volume
- Monitor deliverability rate
- View engagement metrics

---

## Security Best Practices

1. **Protect API Key**
   - Never commit to git
   - Use environment variables
   - Rotate keys every 6 months

2. **Use Domain Email**
   - Always send from `@members.hsnef.org`
   - Never use personal Gmail/Yahoo addresses

3. **Monitor Usage**
   - Check Resend dashboard regularly
   - Set up usage alerts
   - Watch for unusual sending patterns

---

## Free Tier Limits

| Limit | Free Tier | Paid ($20/mo) |
|-------|-----------|---------------|
| **Monthly Emails** | 3,000 | 50,000 |
| **Daily Emails** | 100 | Unlimited |
| **Email Tracking** | ✅ Yes | ✅ Yes |
| **Webhooks** | ✅ Yes | ✅ Yes |
| **Support** | Community | Email |

**For HSNEF:**
- 3,000 emails/month = ~100 emails/day average
- Should be enough for initial launch
- Upgrade if you need more

---

## Email Usage Estimation

| Activity | Emails/Month | Notes |
|----------|--------------|-------|
| Registration invites | 50 | New members |
| Payment receipts | 200 | Memberships + donations |
| Renewal reminders | 300 | Annual members (3 reminders each) |
| Event notifications | 500 | Various events |
| Password resets | 50 | Security emails |
| **Total** | **~1,100/month** | Well within free tier |

---

## Upgrade Path

**When to upgrade:**
- Exceeding 3,000 emails/month
- Need more than 100 emails/day
- Need priority support

**Cost:**
- $20/month for 50,000 emails
- Additional emails at $0.80 per 1,000

**How to upgrade:**
- Go to [resend.com/settings/billing](https://resend.com/settings/billing)
- Click **Upgrade**
- Add payment method

---

## Support & Resources

- **Documentation:** [resend.com/docs](https://resend.com/docs)
- **API Reference:** [resend.com/docs/api-reference](https://resend.com/docs/api-reference)
- **Status:** [status.resend.com](https://status.resend.com)
- **Community:** [resend.com/discord](https://resend.com/discord)

---

## Summary

✅ **Cost:** FREE for 3,000 emails/month
✅ **Setup Time:** 15 minutes
✅ **Deliverability:** Excellent
✅ **Developer-Friendly:** Clean API
✅ **Email Tracking:** Built-in analytics
✅ **Webhooks:** Real-time notifications

**Your HSNEF Membership Portal is ready to send emails via Resend!** 🎉
