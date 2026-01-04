// ============================================================================
// Email Service - Resend
// ============================================================================

import { Resend } from 'resend'

// Lazy initialize Resend client
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Default from address
const DEFAULT_FROM = {
  name: process.env.EMAIL_FROM_NAME || 'HSNEF Membership Portal',
  address: process.env.EMAIL_FROM || 'noreply@members.hsnef.org',
}

// Email options interface
export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: {
    name?: string
    address?: string
  }
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: string | Buffer
  }>
  tags?: Array<{
    name: string
    value: string
  }>
}

/**
 * Send an email via Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const client = getResendClient()

    // Format from address
    const fromAddress = options.from?.address || DEFAULT_FROM.address
    const fromName = options.from?.name || DEFAULT_FROM.name
    const from = `${fromName} <${fromAddress}>`

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    // Add optional fields only if they exist
    if (options.html) emailPayload.html = options.html
    if (options.text) emailPayload.text = options.text
    if (options.replyTo || process.env.EMAIL_REPLY_TO) {
      emailPayload.replyTo = options.replyTo || process.env.EMAIL_REPLY_TO
    }
    if (options.cc) {
      emailPayload.cc = Array.isArray(options.cc) ? options.cc : [options.cc]
    }
    if (options.bcc) {
      emailPayload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc]
    }
    if (options.attachments) emailPayload.attachments = options.attachments
    if (options.tags) emailPayload.tags = options.tags

    // Send email via Resend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await client.emails.send(emailPayload as any)

    if (error) {
      console.error('Resend email error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify Resend API key
 */
export async function verifyEmailConnection() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      }
    }

    // Resend doesn't have a verify endpoint, so we just check if API key exists
    return {
      success: true,
      message: 'Resend API key configured',
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'HSNEF Portal - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9933;">HSNEF Membership Portal</h2>
        <p>This is a test email from your HSNEF Membership Portal.</p>
        <p>If you received this email, your Resend email configuration is working correctly!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from the HSNEF Membership Portal.<br>
          Hindu Society of North East Florida
        </p>
      </div>
    `,
    text: 'This is a test email from your HSNEF Membership Portal. If you received this email, your Resend email configuration is working correctly!',
    tags: [
      { name: 'category', value: 'test' },
    ],
  })
}
