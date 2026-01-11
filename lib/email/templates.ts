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

// Event registration confirmation email
export function eventRegistrationEmail(
  memberName: string,
  membershipId: string,
  event: {
    event_name: string
    event_date: string
    event_time: string
    location: string
    description?: string
    category: string
    member_price: number
  }
): { subject: string; html: string; text: string } {
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Event Registration Confirmed!</h2>
    <p>Dear ${memberName},</p>
    <p>You have successfully registered for the following event:</p>

    <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${event.event_name}</h3>
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>📅 Date:</strong> ${eventDate}<br>
        <strong>⏰ Time:</strong> ${event.event_time}<br>
        <strong>📍 Location:</strong> ${event.location}<br>
        <strong>🏷️ Category:</strong> ${event.category}
        ${event.member_price > 0 ? `<br><strong>💰 Price:</strong> $${event.member_price.toFixed(2)}` : ''}
      </p>
    </div>

    ${event.description ? `<p style="color: #666; font-size: 14px;">${event.description}</p>` : ''}

    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065F46; font-size: 14px;">
        <strong>✓ Your registration is confirmed.</strong><br>
        Please arrive 15 minutes before the event start time.
      </p>
    </div>

    <p style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/events" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View My Events
      </a>
    </p>

    <p style="color: #999; font-size: 12px;">
      Need to cancel? You can cancel your registration from the Events page in your member portal.
    </p>
  `

  return {
    subject: `Registration Confirmed: ${event.event_name}`,
    html: emailWrapper(content),
    text: `Event Registration Confirmed!\n\nDear ${memberName},\n\nYou have successfully registered for:\n\n${event.event_name}\nDate: ${eventDate}\nTime: ${event.event_time}\nLocation: ${event.location}\nCategory: ${event.category}${event.member_price > 0 ? `\nPrice: $${event.member_price.toFixed(2)}` : ''}\n\nPlease arrive 15 minutes before the event start time.\n\nView your events: ${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/events`,
  }
}

// Event cancellation confirmation email
export function eventCancellationEmail(
  memberName: string,
  event: {
    event_name: string
    event_date: string
    event_time: string
    location: string
  }
): { subject: string; html: string; text: string } {
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Event Registration Cancelled</h2>
    <p>Dear ${memberName},</p>
    <p>Your registration for the following event has been cancelled:</p>

    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333; text-decoration: line-through;">${event.event_name}</h3>
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>📅 Date:</strong> ${eventDate}<br>
        <strong>⏰ Time:</strong> ${event.event_time}<br>
        <strong>📍 Location:</strong> ${event.location}
      </p>
    </div>

    <p style="color: #666;">
      If you cancelled by mistake or would like to register again, you can do so from the Events page (subject to availability).
    </p>

    <p style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/events" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View Upcoming Events
      </a>
    </p>
  `

  return {
    subject: `Registration Cancelled: ${event.event_name}`,
    html: emailWrapper(content),
    text: `Event Registration Cancelled\n\nDear ${memberName},\n\nYour registration for the following event has been cancelled:\n\n${event.event_name}\nDate: ${eventDate}\nTime: ${event.event_time}\nLocation: ${event.location}\n\nIf you cancelled by mistake, you can register again from:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/events`,
  }
}

// Booking confirmation email
export function bookingConfirmationEmail(
  memberName: string,
  membershipId: string,
  booking: {
    service_name: string
    booking_date: string
    booking_time?: string
    purohit_name?: string
    amount: number
    notes?: string
    booking_id: string
  }
): { subject: string; html: string; text: string } {
  const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Booking Confirmed!</h2>
    <p>Dear ${memberName},</p>
    <p>Your service booking has been confirmed:</p>

    <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${booking.service_name}</h3>
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>📅 Date:</strong> ${bookingDate}<br>
        ${booking.booking_time ? `<strong>⏰ Time:</strong> ${booking.booking_time}<br>` : ''}
        ${booking.purohit_name ? `<strong>🙏 Priest:</strong> ${booking.purohit_name}<br>` : ''}
        <strong>💰 Amount:</strong> $${booking.amount.toFixed(2)}
      </p>
    </div>

    ${booking.notes ? `
    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>Notes:</strong> ${booking.notes}
      </p>
    </div>
    ` : ''}

    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065F46; font-size: 14px;">
        <strong>✓ Booking Reference:</strong> ${booking.booking_id.slice(0, 8).toUpperCase()}
      </p>
    </div>

    <p style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/bookings" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View My Bookings
      </a>
    </p>

    <p style="color: #666; font-size: 14px;">
      Please arrive 10-15 minutes before your scheduled time. If you need to reschedule or cancel, please contact the temple office.
    </p>
  `

  return {
    subject: `Booking Confirmed: ${booking.service_name}`,
    html: emailWrapper(content),
    text: `Booking Confirmed!\n\nDear ${memberName},\n\nYour service booking has been confirmed:\n\n${booking.service_name}\nDate: ${bookingDate}${booking.booking_time ? `\nTime: ${booking.booking_time}` : ''}${booking.purohit_name ? `\nPriest: ${booking.purohit_name}` : ''}\nAmount: $${booking.amount.toFixed(2)}\n\nBooking Reference: ${booking.booking_id.slice(0, 8).toUpperCase()}\n\nPlease arrive 10-15 minutes before your scheduled time.\n\nView bookings: ${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/bookings`,
  }
}

// Request status update email
export function requestStatusUpdateEmail(
  memberName: string,
  request: {
    request_number: string
    description: string
    amount: number
    status: string
    due_date?: string
  },
  paymentLink?: string
): { subject: string; html: string; text: string } {
  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    'Draft': { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' },
    'Sent': { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    'Paid': { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
    'Completed': { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
    'Cancelled': { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
  }

  const colors = statusColors[request.status] || statusColors['Draft']

  const statusMessage: Record<string, string> = {
    'Sent': 'An invoice has been sent for your service request. Please make payment at your earliest convenience.',
    'Paid': 'Thank you! Your payment has been received and processed.',
    'Completed': 'Your service request has been completed. Thank you for choosing HSNEF.',
    'Cancelled': 'This service request has been cancelled. If you have questions, please contact the temple office.',
  }

  const content = `
    <h2 style="color: #FF9933; margin-top: 0;">Service Request Update</h2>
    <p>Dear ${memberName},</p>
    <p>${statusMessage[request.status] || `Your service request status has been updated to: ${request.status}`}</p>

    <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 10px 0;">
        <span style="display: inline-block; background-color: ${colors.border}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
          ${request.status.toUpperCase()}
        </span>
      </p>
      <p style="margin: 0; color: #333; font-size: 14px;">
        <strong>Request #:</strong> ${request.request_number}<br>
        <strong>Description:</strong> ${request.description}<br>
        <strong>Amount:</strong> $${request.amount.toFixed(2)}
        ${request.due_date ? `<br><strong>Due Date:</strong> ${new Date(request.due_date).toLocaleDateString()}` : ''}
      </p>
    </div>

    ${request.status === 'Sent' && paymentLink ? `
    <p style="margin: 30px 0;">
      <a href="${paymentLink}" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Pay Now
      </a>
    </p>
    ` : `
    <p style="margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/requests" style="display: inline-block; background-color: #FF9933; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View My Requests
      </a>
    </p>
    `}

    <p style="color: #666; font-size: 14px;">
      If you have any questions about this request, please contact the temple office.
    </p>
  `

  return {
    subject: `Service Request ${request.request_number} - ${request.status}`,
    html: emailWrapper(content),
    text: `Service Request Update\n\nDear ${memberName},\n\n${statusMessage[request.status] || `Your service request status has been updated to: ${request.status}`}\n\nRequest #: ${request.request_number}\nDescription: ${request.description}\nAmount: $${request.amount.toFixed(2)}\nStatus: ${request.status}${request.due_date ? `\nDue Date: ${new Date(request.due_date).toLocaleDateString()}` : ''}\n\n${request.status === 'Sent' && paymentLink ? `Pay now: ${paymentLink}` : `View requests: ${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/requests`}`,
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
