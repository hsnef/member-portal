import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/mailer'
import { bookingConfirmationEmail } from '@/lib/email/templates'

// Email templates for different booking statuses
function getBookingSubmittedEmail(memberName: string, booking: any, items: any[]) {
  const itemsList = items.map(item => {
    const date = new Date(item.service_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    return `- ${item.services?.name || 'Service'} on ${date} at ${item.service_time}`
  }).join('\n')

  return {
    subject: `Booking Submitted - Pending Approval`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #FF9933;">
          <h1 style="color: #FF9933; margin: 0;">HSNEF</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Membership Portal</p>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-top: 0;">Booking Submitted</h2>
          <p>Dear ${memberName},</p>
          <p>Your service booking has been submitted and is pending approval by our staff.</p>

          <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Booking Reference: ${booking.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 10px 0 0 0;">Total Amount: $${booking.total_amount.toFixed(2)}</p>
          </div>

          <p><strong>Services Requested:</strong></p>
          <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${itemsList}</pre>

          <p style="color: #666;">You will receive another email once your booking is reviewed. Payment will be requested after approval.</p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Hindu Society of North East Florida</p>
        </div>
      </div>
    `,
    text: `Booking Submitted\n\nDear ${memberName},\n\nYour service booking has been submitted and is pending approval.\n\nBooking Reference: ${booking.id.slice(0, 8).toUpperCase()}\nTotal Amount: $${booking.total_amount.toFixed(2)}\n\nServices Requested:\n${itemsList}\n\nYou will receive another email once your booking is reviewed.`
  }
}

function getBookingApprovedEmail(memberName: string, booking: any, items: any[], paymentLink: string) {
  const itemsList = items.map(item => {
    const date = new Date(item.service_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    return `• ${item.services?.name || 'Service'} - ${date} at ${item.service_time}`
  }).join('<br>')

  return {
    subject: `Booking Approved - Payment Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #FF9933;">
          <h1 style="color: #FF9933; margin: 0;">HSNEF</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Membership Portal</p>
        </div>

        <div style="padding: 30px 0;">
          <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h2 style="color: #065F46; margin: 0;">✓ Booking Approved!</h2>
          </div>

          <p>Dear ${memberName},</p>
          <p>Great news! Your service booking has been approved. Please proceed with payment to confirm your booking.</p>

          <div style="background-color: #FFF5ED; border-left: 4px solid #FF9933; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Booking Reference: ${booking.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 10px 0; font-size: 24px; color: #FF9933; font-weight: bold;">$${booking.total_amount.toFixed(2)}</p>
            <p style="margin: 0;">${itemsList}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="display: inline-block; background-color: #FF9933; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
              Pay Now
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">Please complete payment as soon as possible to secure your booking date.</p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Hindu Society of North East Florida</p>
        </div>
      </div>
    `,
    text: `Booking Approved!\n\nDear ${memberName},\n\nYour service booking has been approved. Please proceed with payment.\n\nBooking Reference: ${booking.id.slice(0, 8).toUpperCase()}\nTotal Amount: $${booking.total_amount.toFixed(2)}\n\nPay now: ${paymentLink}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { bookingId, status } = await request.json()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get booking items with service names
    const { data: items } = await supabase
      .from('service_booking_items')
      .select('*, services(name)')
      .eq('booking_id', bookingId)

    const memberName = booking.requester_name
    const memberEmail = booking.requester_email

    let emailContent

    if (status === 'Pending Approval' || status === 'submitted') {
      emailContent = getBookingSubmittedEmail(memberName, booking, items || [])
    } else if (status === 'Approved' || status === 'Payment Required') {
      const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://member.hsnef.org'}/member/bookings/${bookingId}/payment`
      emailContent = getBookingApprovedEmail(memberName, booking, items || [], paymentLink)
    } else if (status === 'Confirmed' || status === 'Paid') {
      // Use the booking confirmation template
      const firstItem = items?.[0]
      emailContent = bookingConfirmationEmail(memberName, booking.membership_id || 'N/A', {
        service_name: items?.map(i => i.services?.name).join(', ') || 'Service',
        booking_date: firstItem?.service_date || new Date().toISOString(),
        booking_time: firstItem?.service_time,
        purohit_name: undefined, // Would need to join purohits table
        amount: booking.total_amount,
        notes: booking.additional_notes,
        booking_id: bookingId,
      })
    } else {
      return NextResponse.json({ error: 'Invalid status for notification' }, { status: 400 })
    }

    // Send email
    const emailResult = await sendEmail({
      to: memberEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [
        { name: 'category', value: 'booking-notification' },
        { name: 'booking_id', value: bookingId },
        { name: 'status', value: status },
      ],
    })

    if (!emailResult.success) {
      console.error('Failed to send booking notification:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
    })
  } catch (error) {
    console.error('Error sending booking notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
