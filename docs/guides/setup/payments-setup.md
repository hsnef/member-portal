# Payments & Receipts System Setup Guide

## Overview
The HSNEF Member Portal includes a complete payment processing system with Stripe integration, manual payment recording, and automated PDF receipt generation.

## Features Implemented

### 1. **Payment Recording (Staff)**
- Manual payment entry for cash, check, and card payments
- Member search and selection
- Payment categories: Membership, Donation, Service, Event, Other
- Check number and transaction ID tracking
- Notes field for additional details

**Location:** `/admin/payments/new`

### 2. **Payment Management (Staff)**
- View all payments with filtering by category and method
- Search by member name, ID, or email
- Payment statistics and totals
- Receipt generation for any payment

**Location:** `/admin/payments`

### 3. **Online Payments (Members)**

#### Membership Renewal
- Choose between Annual ($251) and Lifetime ($1001) membership
- Secure Stripe checkout integration
- Auto-update membership level after payment

**Location:** `/member/renew`

#### Donations
- Suggested donation amounts: $25, $51, $101, $251, $501, $1001
- Custom amount option
- Donation purpose selection (General, Building, Festival, Education, etc.)
- Tax-deductible receipts

**Location:** `/member/donate`

### 4. **Payment History (Members)**
- View all personal payments
- Filter by year
- Download PDF receipts
- Tax-deductible donation totals

**Location:** `/member/payments`

### 5. **Payment Success**
- Confirmation page after successful payment
- Email notification (ready for integration)
- Auto-redirect to dashboard

**Location:** `/member/payment-success`

### 6. **PDF Receipt Generation**
- Professional temple-branded receipts
- Includes member details, payment info, and notes
- Tax-deductible notice for donations
- Downloadable from payment history

## Stripe Setup Instructions

### Step 1: Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for an account or log in
3. Complete the business verification process

### Step 2: Get API Keys
1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy the **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Step 3: Configure Webhook
Webhooks allow Stripe to notify your app when payments succeed.

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
   - For local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) or ngrok
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### Step 4: Test Payments
Use Stripe test cards for testing:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined payment |
| 4000 0025 0000 3155 | Requires authentication |

- Use any future expiration date
- Use any 3-digit CVC
- Use any ZIP code

### Step 5: Go Live
When ready for production:

1. Complete Stripe account activation
2. Switch to **Live mode** in Stripe Dashboard
3. Get **Live API keys** and update `.env.local`
4. Update webhook endpoint to production URL
5. Test with a real payment

## QR Token Secret Setup

The QR codes use JWT signing for security. Generate a secure random string:

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator
```

Add to `.env.local`:
```env
QR_TOKEN_SECRET=your-generated-secret-key
```

## Database Configuration

The payment system uses the `payments` table which should already be created. Verify the schema:

```sql
-- Payments table structure
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  membership_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method payment_method_enum NOT NULL,
  category payment_category_enum NOT NULL,
  check_number TEXT,
  transaction_id TEXT,
  stripe_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Payment Flow

### Manual Payment (Staff)
1. Staff navigates to **Admin** → **Payments** → **Record Payment**
2. Search and select member
3. Enter payment details (amount, method, category)
4. Submit → Payment recorded in database
5. Receipt can be generated immediately

### Online Payment (Member)
1. Member clicks **Renew Membership** or **Donations**
2. Select amount/level
3. Enter payment details (Stripe checkout)
4. Submit → Payment processed by Stripe
5. Stripe webhook confirms payment
6. Payment recorded in database automatically
7. Member level updated (if membership payment)
8. Redirect to success page
9. Email receipt sent

## Receipt Generation

Receipts are generated using jsPDF and include:
- Temple header with logo space
- Receipt number (generated from payment ID)
- Member information
- Payment details (amount, method, category)
- Tax-deductible notice for donations
- Professional formatting

## Testing Checklist

- [ ] Manual payment recording works
- [ ] Payment list displays correctly
- [ ] Search and filters function
- [ ] Member can renew membership with test card
- [ ] Member can make donation with test card
- [ ] Payment webhook receives confirmation
- [ ] Payment recorded in database
- [ ] Member level updates after membership payment
- [ ] PDF receipt downloads correctly
- [ ] Tax-deductible notice shows on donation receipts
- [ ] Payment history shows all member payments
- [ ] Payment success page redirects correctly

## Troubleshooting

### Webhook not working locally
Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Payment not recording in database
1. Check webhook logs in Stripe Dashboard
2. Verify webhook secret is correct
3. Check server logs for errors
4. Ensure database RLS policies allow inserts

### Stripe checkout not loading
1. Verify publishable key is correct
2. Check browser console for errors
3. Ensure payment intent is created successfully

## Security Notes

- Never commit `.env.local` to version control
- Use test mode for development
- Webhook signatures are verified automatically
- QR tokens expire after 1 year
- All payments require authentication
- RLS policies protect payment data

## Next Steps

After payments are working:
1. Configure email notifications (Resend integration)
2. Set up automated tax receipts at year-end
3. Add payment analytics dashboard
4. Integrate with accounting software (QuickBooks, etc.)
5. Add recurring payment subscriptions

## Support

For issues or questions:
- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: Available in Stripe Dashboard
- HSNEF Tech Team: [contact info]
