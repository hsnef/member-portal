// ============================================================================
// Payment Email Templates
// ============================================================================

import { TEMPLE_CONFIG } from '@/lib/constants/temple'

interface PaymentFailureEmailData {
  memberName: string
  membershipId: string
  amount: number
  category: string
  errorMessage?: string
  retryUrl: string
}

interface PaymentSuccessEmailData {
  memberName: string
  membershipId: string
  amount: number
  category: string
  paymentDate: string
  receiptUrl: string
}

/**
 * Generate payment failure notification email
 */
export function getPaymentFailureEmail(data: PaymentFailureEmailData) {
  const subject = `Payment Failed - Action Required`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #c75b12;">
        <h1 style="color: #c75b12; margin: 0; font-size: 24px;">${TEMPLE_CONFIG.name}</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Membership Portal</p>
      </div>

      <!-- Alert Banner -->
      <div style="background-color: #fbebe8; border: 1px solid #fbebe8; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
          <div>
            <h2 style="color: #b23a2e; margin: 0 0 8px 0; font-size: 18px;">Payment Failed</h2>
            <p style="color: #b23a2e; margin: 0; font-size: 14px;">
              Your recent payment could not be processed. Please try again or use a different payment method.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Details -->
      <div style="background-color: #fffbf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #2b2018; font-size: 16px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Member Name:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px; font-weight: 600;">${data.memberName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Membership ID:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px; font-family: monospace;">${data.membershipId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Category:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px;">${data.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Amount:</td>
            <td style="padding: 8px 0; color: #b23a2e; font-size: 18px; font-weight: 700;">$${data.amount.toFixed(2)}</td>
          </tr>
          ${data.errorMessage ? `
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Reason:</td>
            <td style="padding: 8px 0; color: #b23a2e; font-size: 14px;">${data.errorMessage}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- What to do -->
      <div style="margin: 24px 0;">
        <h3 style="color: #2b2018; font-size: 16px; margin: 0 0 12px 0;">What You Can Do</h3>
        <ul style="color: #6a5b4b; font-size: 14px; padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 8px;">Check that your card details are correct</li>
          <li style="margin-bottom: 8px;">Ensure sufficient funds are available</li>
          <li style="margin-bottom: 8px;">Try a different payment method</li>
          <li style="margin-bottom: 8px;">Contact your bank if the issue persists</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.retryUrl}"
           style="display: inline-block; background-color: #c75b12; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Try Payment Again
        </a>
      </div>

      <!-- Help Section -->
      <div style="background-color: #f4ede3; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="color: #6a5b4b; margin: 0 0 8px 0; font-size: 14px;">Need Help?</h4>
        <p style="color: #6a5b4b; margin: 0; font-size: 14px;">
          If you continue to experience issues, please contact the temple office at
          <a href="mailto:${TEMPLE_CONFIG.contact.email}" style="color: #6a5b4b;">${TEMPLE_CONFIG.contact.email}</a>
          or call ${TEMPLE_CONFIG.contact.phone}.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #f1e6d5; padding-top: 20px; margin-top: 32px; text-align: center;">
        <p style="color: #9b8c7a; font-size: 12px; margin: 0;">
          ${TEMPLE_CONFIG.name}<br>
          ${TEMPLE_CONFIG.address.full}<br>
          <a href="${TEMPLE_CONFIG.contact.website}" style="color: #c75b12;">${TEMPLE_CONFIG.contact.website}</a>
        </p>
        <p style="color: #9b8c7a; font-size: 11px; margin: 16px 0 0 0;">
          This email was sent from the HSNEF Membership Portal. Please do not reply directly to this email.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
PAYMENT FAILED - ACTION REQUIRED

Dear ${data.memberName},

Your recent payment could not be processed. Please try again or use a different payment method.

PAYMENT DETAILS
---------------
Member Name: ${data.memberName}
Membership ID: ${data.membershipId}
Category: ${data.category}
Amount: $${data.amount.toFixed(2)}
${data.errorMessage ? `Reason: ${data.errorMessage}` : ''}

WHAT YOU CAN DO
---------------
- Check that your card details are correct
- Ensure sufficient funds are available
- Try a different payment method
- Contact your bank if the issue persists

To retry your payment, please visit: ${data.retryUrl}

NEED HELP?
----------
If you continue to experience issues, please contact the temple office:
Email: ${TEMPLE_CONFIG.contact.email}
Phone: ${TEMPLE_CONFIG.contact.phone}

---
${TEMPLE_CONFIG.name}
${TEMPLE_CONFIG.address.full}
${TEMPLE_CONFIG.contact.website}
  `.trim()

  return { subject, html, text }
}

/**
 * Generate payment success confirmation email
 */
export function getPaymentSuccessEmail(data: PaymentSuccessEmailData) {
  const subject = `Payment Confirmed - $${data.amount.toFixed(2)} ${data.category}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #c75b12;">
        <h1 style="color: #c75b12; margin: 0; font-size: 24px;">${TEMPLE_CONFIG.name}</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Membership Portal</p>
      </div>

      <!-- Success Banner -->
      <div style="background-color: #eaf2ec; border: 1px solid #eaf2ec; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: 24px; margin-right: 12px;">✅</span>
          <div>
            <h2 style="color: #4e7a63; margin: 0 0 8px 0; font-size: 18px;">Payment Successful!</h2>
            <p style="color: #4e7a63; margin: 0; font-size: 14px;">
              Thank you for your payment. Your transaction has been processed successfully.
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Details -->
      <div style="background-color: #fffbf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #2b2018; font-size: 16px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Member Name:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px; font-weight: 600;">${data.memberName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Membership ID:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px; font-family: monospace;">${data.membershipId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Category:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px;">${data.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Date:</td>
            <td style="padding: 8px 0; color: #2b2018; font-size: 14px;">${data.paymentDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6a5b4b; font-size: 14px;">Amount:</td>
            <td style="padding: 8px 0; color: #4e7a63; font-size: 18px; font-weight: 700;">$${data.amount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Receipt Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.receiptUrl}"
           style="display: inline-block; background-color: #c75b12; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Receipt
        </a>
      </div>

      ${data.category === 'Donation' ? `
      <!-- Tax Deductible Notice -->
      <div style="background-color: #eaf2ec; border: 1px solid #eaf2ec; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h4 style="color: #4e7a63; margin: 0 0 8px 0; font-size: 14px;">📋 Tax Deductible Donation</h4>
        <p style="color: #4e7a63; margin: 0; font-size: 14px;">
          ${TEMPLE_CONFIG.messaging.taxDeductible}
        </p>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top: 1px solid #f1e6d5; padding-top: 20px; margin-top: 32px; text-align: center;">
        <p style="color: #6a5b4b; font-size: 14px; margin: 0 0 16px 0;">
          ${TEMPLE_CONFIG.messaging.thankYou}
        </p>
        <p style="color: #9b8c7a; font-size: 12px; margin: 0;">
          ${TEMPLE_CONFIG.name}<br>
          ${TEMPLE_CONFIG.address.full}<br>
          Tax ID: ${TEMPLE_CONFIG.taxId}<br>
          <a href="${TEMPLE_CONFIG.contact.website}" style="color: #c75b12;">${TEMPLE_CONFIG.contact.website}</a>
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
PAYMENT CONFIRMED

Dear ${data.memberName},

Thank you for your payment. Your transaction has been processed successfully.

PAYMENT DETAILS
---------------
Member Name: ${data.memberName}
Membership ID: ${data.membershipId}
Category: ${data.category}
Date: ${data.paymentDate}
Amount: $${data.amount.toFixed(2)}

To view your receipt, visit: ${data.receiptUrl}

${data.category === 'Donation' ? `
TAX DEDUCTIBLE DONATION
-----------------------
${TEMPLE_CONFIG.messaging.taxDeductible}
` : ''}

${TEMPLE_CONFIG.messaging.thankYou}

---
${TEMPLE_CONFIG.name}
${TEMPLE_CONFIG.address.full}
Tax ID: ${TEMPLE_CONFIG.taxId}
${TEMPLE_CONFIG.contact.website}
  `.trim()

  return { subject, html, text }
}
