// ============================================================================
// Email Templates
// ============================================================================

import type { Member, Receipt, Request } from '@/types/database'

// Base email wrapper with HSNEF branding
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HSNEF Membership Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF9933 0%, #FF7A0E 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">HSNEF</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 14px;">Hindu Society of North East Florida</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                This email was sent from the HSNEF Membership Portal<br>
                <a href="https://hsnef.org" style="color: #FF9933; text-decoration: none;">Visit Main Website</a> |
                <a href="https://portal.hsnef.org" style="color: #FF9933; text-decoration: none;">Member Portal</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Registration invitation email
export function registrationInvitationEmail(
  member: Member,
  invitationLink: string
): { subject: string; html: string; text: string } {
  const memberName = member.profile_name || `${member.first_name} ${member.last_name}` || member.business_name

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Welcome to HSNEF!</h2>
    <p>Dear ${memberName},</p>
    <p>You have been registered for the HSNEF Membership Portal. Please complete your registration by setting up your account.</p>
    <p style="margin: 30px 0;">
      <a href="${invitationLink}" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Complete Registration
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">
      <strong>Your Membership ID:</strong> ${member.membership_id}
    </p>
    <p style="color: #999; font-size: 12px;">
      This invitation link will expire in 7 days. If you need a new invitation, please contact the temple office.
    </p>
  `

  return {
    subject: 'Complete Your HSNEF Membership Registration',
    html: emailWrapper(content),
    text: `Welcome to HSNEF!\n\nDear ${memberName},\n\nYou have been registered for the HSNEF Membership Portal. Please complete your registration by visiting:\n\n${invitationLink}\n\nYour Membership ID: ${member.membership_id}\n\nThis invitation link will expire in 7 days.`,
  }
}

// Payment receipt email
export function paymentReceiptEmail(
  member: Member,
  receipt: Receipt
): { subject: string; html: string; text: string } {
  const memberName = member.profile_name || `${member.first_name} ${member.last_name}` || member.business_name

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Payment Receipt</h2>
    <p>Dear ${memberName},</p>
    <p>Thank you for your payment. Here are the details:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Receipt Number:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${receipt.receipt_number}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(receipt.receipt_date).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 18px; color: #FF9933;"><strong>$${receipt.amount.toFixed(2)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${receipt.payment_method}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Purpose:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${receipt.purpose}</td>
      </tr>
    </table>

    <p style="color: #666; font-size: 14px;">
      Please keep this receipt for your records. You can view and download this receipt anytime from your member portal.
    </p>
  `

  return {
    subject: `HSNEF Receipt ${receipt.receipt_number}`,
    html: emailWrapper(content),
    text: `Payment Receipt\n\nDear ${memberName},\n\nThank you for your payment.\n\nReceipt Number: ${receipt.receipt_number}\nDate: ${new Date(receipt.receipt_date).toLocaleDateString()}\nAmount: $${receipt.amount.toFixed(2)}\nPayment Method: ${receipt.payment_method}\nPurpose: ${receipt.purpose}\n\nPlease keep this receipt for your records.`,
  }
}

// Payment request email
export function paymentRequestEmail(
  member: Member,
  request: Request,
  paymentLink: string
): { subject: string; html: string; text: string } {
  const memberName = member.profile_name || `${member.first_name} ${member.last_name}` || member.business_name

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Payment Request</h2>
    <p>Dear ${memberName},</p>
    <p>You have a payment request from HSNEF:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Request Number:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${request.request_number}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Description:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${request.description}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount Due:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 18px; color: #FF9933;"><strong>$${request.amount.toFixed(2)}</strong></td>
      </tr>
      ${request.due_date ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(request.due_date).toLocaleDateString()}</td>
      </tr>
      ` : ''}
    </table>

    <p style="margin: 30px 0;">
      <a href="${paymentLink}" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Pay Now
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      You can also pay this request by visiting the temple office or by calling us at (904) XXX-XXXX.
    </p>
  `

  return {
    subject: `Payment Request ${request.request_number} - HSNEF`,
    html: emailWrapper(content),
    text: `Payment Request\n\nDear ${memberName},\n\nYou have a payment request from HSNEF.\n\nRequest Number: ${request.request_number}\nDescription: ${request.description}\nAmount Due: $${request.amount.toFixed(2)}${request.due_date ? `\nDue Date: ${new Date(request.due_date).toLocaleDateString()}` : ''}\n\nPay online: ${paymentLink}\n\nOr visit the temple office.`,
  }
}

// Membership renewal reminder
export function renewalReminderEmail(
  member: Member,
  year: number,
  renewalLink: string
): { subject: string; html: string; text: string } {
  const memberName = member.profile_name || `${member.first_name} ${member.last_name}`

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Membership Renewal Reminder</h2>
    <p>Dear ${memberName},</p>
    <p>Your HSNEF Annual Membership for ${year} is due for renewal.</p>

    <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #333;">
        <strong>Membership ID:</strong> ${member.membership_id}<br>
        <strong>Renewal Year:</strong> ${year}
      </p>
    </div>

    <p style="margin: 30px 0;">
      <a href="${renewalLink}" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Renew Now
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      Continue your support of HSNEF and enjoy member benefits including priority access to events, voting rights, and more.
    </p>
  `

  return {
    subject: `Renew Your ${year} HSNEF Membership`,
    html: emailWrapper(content),
    text: `Membership Renewal Reminder\n\nDear ${memberName},\n\nYour HSNEF Annual Membership for ${year} is due for renewal.\n\nMembership ID: ${member.membership_id}\nRenewal Year: ${year}\n\nRenew online: ${renewalLink}\n\nContinue your support of HSNEF and enjoy member benefits.`,
  }
}

// Welcome email after successful registration
export function welcomeEmail(member: Member): { subject: string; html: string; text: string } {
  const memberName = member.profile_name || `${member.first_name} ${member.last_name}` || member.business_name

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Welcome to HSNEF!</h2>
    <p>Dear ${memberName},</p>
    <p>Thank you for completing your registration. Your HSNEF Membership Portal account is now active!</p>

    <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #333;">
        <strong>Your Membership ID:</strong> ${member.membership_id}<br>
        <strong>Membership Level:</strong> ${member.current_level}
      </p>
    </div>

    <h3 style="color: #333;">What's Next?</h3>
    <ul style="color: #666; line-height: 1.8;">
      <li>Access your membership pass</li>
      <li>Manage your family members</li>
      <li>Register for upcoming events</li>
      <li>Make donations and payments</li>
      <li>View your activity history</li>
    </ul>

    <p style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Go to Dashboard
      </a>
    </p>
  `

  return {
    subject: 'Welcome to HSNEF Membership Portal',
    html: emailWrapper(content),
    text: `Welcome to HSNEF!\n\nDear ${memberName},\n\nThank you for completing your registration. Your HSNEF Membership Portal account is now active!\n\nYour Membership ID: ${member.membership_id}\nMembership Level: ${member.current_level}\n\nVisit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }
}
